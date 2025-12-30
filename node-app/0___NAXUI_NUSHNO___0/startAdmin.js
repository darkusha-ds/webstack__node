import adminApp from './sites/0_admin/index.js';
import bodyParser from 'body-parser';

import { log } from '#import';


adminApp.listen(3010, () => {
  log(`🛠 AdminJS работает на http://localhost:3010`);
});

adminApp.use(bodyParser.json());

adminApp.post('/admin/api/pages/Fonts', async (req, res) => {
  const { fontName } = req.body;
  log(`📦 Получен запрос на установку шрифта: ${fontName}`);

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const installCmd = `npm i ${fontName} --prefix ./library`;
    const { stdout, stderr } = await execAsync(installCmd);

    log(stdout);
    if (stderr) console.error(stderr);

    // Check if package was installed successfully
    const installedPackageJson = `./library/node_modules/${fontName}/package.json`;
    try {
      await import(installedPackageJson, { with: { type: "json" } });
    } catch (e) {
      throw new Error(`Пакет ${fontName} установлен, но не удалось найти package.json`);
    }

    res.json({ notice: { message: `✅ Шрифт "${fontName}" установлен.`, type: 'success' } });
  } catch (error) {
    console.error(error);
    res.json({ notice: { message: `❌ Ошибка установки шрифта: ${error.message}`, type: 'error' } });
  }
});