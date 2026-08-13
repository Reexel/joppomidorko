const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const manifestPath = path.resolve(distDir, 'manifest.json');
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');

if (!fs.existsSync(manifestPath)) {
    console.error('❌ manifest.json не найден в dist/.');
    process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Берём версию из package.json, если есть, иначе из manifest
const version = packageJson.version || manifest.version || '0.0.0';
const pluginId = manifest.id;

const projectRoot = path.resolve(__dirname, '..');
// Имя файла с версией: joplin.plugin.jop-pomidorko-1.0.0.jpl
const outputFile = path.resolve(projectRoot, `${pluginId}-v${version}.jpl`);
// Также сохраняем копию без версии для удобства
const outputFileLatest = path.resolve(projectRoot, `${pluginId}.jpl`);

try {
    // Удаляем старые файлы
    if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
    }
    if (fs.existsSync(outputFileLatest)) {
        fs.unlinkSync(outputFileLatest);
    }

    // Создаём tar.gz архив (Joplin формат .jpl)
    execSync(`cd "${distDir}" && tar -czf "${outputFile}" .`, { stdio: 'inherit' });

    // Создаём копию без версии (latest)
    fs.copyFileSync(outputFile, outputFileLatest);

    console.log(`\n✅ Плагин успешно собран!`);
    console.log(`   Версия: v${version}`);
    console.log(`   Файл с версией: ${path.basename(outputFile)}`);
    console.log(`   Файл без версии (latest): ${path.basename(outputFileLatest)}`);
} catch (error) {
    console.error('❌ Ошибка при создании архива:', error.message);
    process.exit(1);
}
