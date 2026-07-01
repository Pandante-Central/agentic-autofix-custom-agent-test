import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import { get } from '../db';
import { AuthedRequest, requireAuth } from '../middleware/auth';

export const exportRouter = Router();

exportRouter.use(requireAuth);

const templatesDir = path.join(__dirname, '..', '..', 'templates');

// VULN: A05 Injection - CWE-22 Improper Limitation of a Pathname to a
// Restricted Directory ("Path Traversal")
// `template` comes straight from the client and is joined onto the
// templates directory without sanitizing `../` sequences, letting an
// attacker read arbitrary files on the server (e.g. `?template=../../../../etc/passwd`).
exportRouter.get('/template', async (req: AuthedRequest, res, next) => {
  try {
    const template = String(req.query.template ?? 'default.html');
    const filePath = path.join(templatesDir, template);
    const contents = fs.readFileSync(filePath, 'utf8');
    res.type('html').send(contents);
  } catch (err) {
    next(err);
  }
});

// VULN: A05 Injection - CWE-78 Improper Neutralization of Special Elements
// used in an OS Command ("OS Command Injection")
// The plan's title is interpolated directly into a shell command string
// passed to `exec()`. A crafted plan name like
// `My Plan"; rm -rf / #` would be executed by the shell.
exportRouter.get('/:id/report', async (req: AuthedRequest, res, next) => {
  try {
    const plan = await get<{ id: number; name: string }>(
      'SELECT id, name FROM plans WHERE id = ? AND user_id = ?',
      [req.params.id, req.user?.id]
    );
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const outputPath = path.join(templatesDir, `report-${plan.id}.txt`);
    const command = `echo "Retirement report for ${plan.name}" > "${outputPath}"`;

    exec(command, (err, stdout, stderr) => {
      if (err) {
        return next(err);
      }
      res.type('text').sendFile(outputPath);
    });
  } catch (err) {
    next(err);
  }
});
