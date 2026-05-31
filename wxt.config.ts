import { defineConfig } from 'wxt';

const UPDATE_BASE =
  'https://raw.githubusercontent.com/Brawl345/llm-translator/master';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  srcDir: '.',
  manifestVersion: 3,
  manifest: ({ browser, mode }) => {
    // Self-hosted update endpoints only matter for production GitHub builds.
    const selfHosted = mode === 'production';
    return {
      name: '__MSG_extensionName__',
      description: '__MSG_extensionDescription__',
      default_locale: 'en',
      author: 'Andreas Bielawski',
      action: {
        default_title: '__MSG_contextMenuTitle__',
      },
      permissions: ['contextMenus', 'storage', 'activeTab', 'scripting'],
      host_permissions: ['https://api.openai.com/*'],
      ...(selfHosted && browser === 'chrome'
        ? { update_url: `${UPDATE_BASE}/updates.xml` }
        : {}),
      browser_specific_settings: {
        gecko: {
          id: 'llm-translator@brawl345.github.com',
          strict_min_version: '140.0',
          data_collection_permissions: {
            required: ['authenticationInfo', 'websiteContent'],
          },
          ...(selfHosted && browser === 'firefox'
            ? { update_url: `${UPDATE_BASE}/updates.json` }
            : {}),
        },
      },
    };
  },
});
