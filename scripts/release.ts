#!/usr/bin/env tsx

import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

interface PackageJson {
  name: string;
  version: string;
  repository?: {
    url?: string;
  };
}

interface Manifest {
  version: string;
  browser_specific_settings?: {
    gecko?: {
      id?: string;
    };
  };
}

interface FirefoxUpdate {
  version: string;
  update_link: string;
  update_info_url: string;
}

interface FirefoxUpdateManifest {
  addons: {
    [key: string]: {
      updates: FirefoxUpdate[];
    };
  };
}

const CHROME_EXTENSION_ID = 'jldajcpbpceomijamlamdkgmeadnndjn';

function buildExtensions() {
  const manifestPath = './public/manifest.json';
  const manifest: Manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const version = manifest.version;

  console.log(`🚀 Creating release for v${version}...`);
  console.log('');

  const packageJson: PackageJson = JSON.parse(
    readFileSync('package.json', 'utf-8'),
  );

  console.log('📝 Syncing package.json version...');
  packageJson.version = version;
  writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('');

  console.log('📦 Building extension...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('');

  const outputDir = 'output';
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log('🦊 Building Firefox extension...');
  const firefoxOutputFile = `llm-translator-${version}.xpi`;
  const firefoxOutputPath = join(outputDir, firefoxOutputFile);

  execSync(
    `web-ext build --source-dir=./public --artifacts-dir=./output --filename=${firefoxOutputFile} --overwrite-dest`,
    { stdio: 'ignore' },
  );

  console.log(`✅ Built successfully: ${firefoxOutputPath}`);
  console.log('');

  console.log('🌐 Building Chrome extension...');
  const publicPath = resolve('public');
  const pemPath = resolve('public.pem');
  const crxPath = resolve('public.crx');

  if (!existsSync(pemPath)) {
    console.error(
      '❌ public.pem file not found. Cannot sign Chrome extension.',
    );
    process.exit(1);
  }

  if (existsSync(crxPath)) {
    unlinkSync(crxPath);
  }

  execSync(
    `/Applications/Google\\ Chrome\\ Canary.app/Contents/MacOS/Google\\ Chrome\\ Canary --pack-extension="${publicPath}" --pack-extension-key="${pemPath}"`,
    { stdio: 'inherit' },
  );

  if (!existsSync(crxPath)) {
    console.error('❌ Failed to create public.crx file.');
    process.exit(1);
  }

  const chromeOutputFile = `llm-translator-${version}.crx`;
  const chromeOutputPath = join(outputDir, chromeOutputFile);
  renameSync(crxPath, chromeOutputPath);

  console.log(`✅ Built successfully: ${chromeOutputPath}`);
  console.log('');

  return { packageJson, version, manifest };
}

function updateFirefoxJson(
  packageJson: PackageJson,
  version: string,
  manifest: Manifest,
) {
  console.log('📝 Updating Firefox update manifest...');

  const packageName = packageJson.name;
  const repositoryUrl = packageJson.repository?.url;
  if (!repositoryUrl) {
    console.error('❌ Repository URL not found in package.json');
    process.exit(1);
  }

  let repoUrl = repositoryUrl;
  if (repoUrl.startsWith('git+')) {
    repoUrl = repoUrl.substring(4);
  }
  if (repoUrl.endsWith('.git')) {
    repoUrl = repoUrl.slice(0, -4);
  }

  const firefoxId = manifest.browser_specific_settings?.gecko?.id;
  if (!firefoxId) {
    console.error('❌ Firefox extension ID not found in manifest.json');
    process.exit(1);
  }

  const jsonContent: FirefoxUpdateManifest = {
    addons: {
      [firefoxId]: {
        updates: [
          {
            version: version,
            update_link: `${repoUrl}/releases/download/${version}/${packageName}-${version}.xpi`,
            update_info_url: `${repoUrl}/releases/tag/${version}`,
          },
        ],
      },
    },
  };

  writeFileSync('updates.json', JSON.stringify(jsonContent, null, 2));
  console.log('✅ updates.json updated');
}

function updateChromeXml(packageJson: PackageJson, version: string) {
  console.log('📝 Updating Chrome update manifest...');

  const packageName = packageJson.name;
  const repositoryUrl = packageJson.repository?.url;
  if (!repositoryUrl) {
    console.error('❌ Repository URL not found in package.json');
    process.exit(1);
  }

  let repoUrl = repositoryUrl;
  if (repoUrl.startsWith('git+')) {
    repoUrl = repoUrl.substring(4);
  }
  if (repoUrl.endsWith('.git')) {
    repoUrl = repoUrl.slice(0, -4);
  }

  const xmlContent = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${CHROME_EXTENSION_ID}'>
    <updatecheck codebase='${repoUrl}/releases/download/${version}/${packageName}-${version}.crx' version='${version}' />
  </app>
</gupdate>`;

  writeFileSync('updates.xml', xmlContent);
  console.log('✅ updates.xml updated');
}

function main() {
  const { packageJson, version, manifest } = buildExtensions();

  // Update manifests
  updateFirefoxJson(packageJson, version, manifest);
  updateChromeXml(packageJson, version);

  console.log('');
  console.log(`🎉 Release v${version} created successfully!`);
  console.log('');
  console.log('📁 Generated files:');
  console.log(`   output/llm-translator-${version}.xpi`);
  console.log(`   output/llm-translator-${version}.crx`);
  console.log('   updates.json');
  console.log('   updates.xml');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
