import { AdminJS, AdminJSSequelize, db2, log } from '#import';

AdminJS.registerAdapter({ Database: AdminJSSequelize.Database, Resource: AdminJSSequelize.Resource });

const adminOptions = {
  rootPath: '/admin',
  resources: [
    ...Object.values(db2)
      .filter(model => model?.tableName)
      .map(model => {
        const baseOptions = {
          listProperties: [
            'id',
            ...Object.keys(model.rawAttributes).filter(key => key !== 'id'),
          ],
        };

        if (model.tableName === 'fonts_fonts') {
          baseOptions.actions = {
            installFont: {
              actionType: 'record',
              icon: 'Download',
              handler: async (request, response, context) => {
                const { record } = context;
                const fontPackage = record.param('name');
                const { exec } = await import('child_process');
                console.log(`📦 Установка шрифта: ${fontPackage}`);
                exec(`npm install ${fontPackage} --prefix ./library`, (err, stdout, stderr) => {
                  console.log('🚀 Вызов exec() завершён');
                  if (err) {
                    console.error('❌ Ошибка установки:', err);
                    console.error('🔢 Код ошибки:', err.code);
                    console.error('📄 Сообщение:', err.message);
                  } else {
                    console.log('✅ Установка завершена успешно');
                  }
                  console.log('📥 STDOUT:', stdout);
                  console.error('⚠️ STDERR:', stderr);
                });
                return {
                  record: record.toJSON(),
                  notice: {
                    message: `Шрифт ${fontPackage} установлен.`,
                    type: 'success',
                  },
                };
              },
            },
          };
        }

        return {
          resource: model,
          options: baseOptions,
        };
      }),
  ],
  branding: {
    companyName: 'DarkAdmin',
    softwareBrothers: false,
  },
};

export default adminOptions;