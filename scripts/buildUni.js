const path = require('path')
const { spawnSync } = require('child_process')

const platform = process.argv[2]
if (!platform) {
  console.error('Usage: node scripts/buildUni.js <platform>')
  process.exit(2)
}

const projectRoot = path.resolve(__dirname, '..')
const hbuilderxPlugins = process.env.UNI_HBUILDERX_PLUGINS ||
  process.env.HBUILDERX_PLUGINS ||
  (process.env.HBUILDERX_CLI
    ? path.resolve(path.dirname(process.env.HBUILDERX_CLI), 'plugins')
    : '')
let result
const cli = require.resolve('@vue/cli-service/bin/vue-cli-service')
result = spawnSync(process.execPath, [cli, 'uni-build', '--platform', platform], {
  cwd: projectRoot,
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    UNI_PLATFORM: platform,
    UNI_CLI_CONTEXT: projectRoot,
    UNI_INPUT_DIR: projectRoot,
    UNI_SASS_IMPLEMENTATION_NAME: 'sass',
    ...(hbuilderxPlugins ? { UNI_HBUILDERX_PLUGINS: hbuilderxPlugins } : {}),
  },
  stdio: 'inherit',
  shell: false,
})

process.exit(result && typeof result.status === 'number' ? result.status : 1)
