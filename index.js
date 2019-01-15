const path = require('path')
const os = require('os')
const fs = require('fs')
const { exec } = require('child_process')
const { CompositeDisposable } = require('atom')

module.exports = {
  activate() {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(
      atom.workspace.observeTextEditors(textEditor => {
        this.subscriptions.add(textEditor.onDidSave(handleDidSave.bind(this)))
      })
    )
  }
}

function handleDidSave(event) {
  const configPath = findConfigPath(event.path)
  if (configPath) {
    execTcr(configPath)
  }
}

function findConfigPath(startPath) {
  const potentialPath = path.join(startPath, './.tcr')
  if (fs.existsSync(potentialPath)) return potentialPath
  if (startPath === os.homedir()) return null
  return findConfigPath(path.join(startPath, '..'))
}

function execTcr(configPath) {
  const config = parseConfig(configPath)
  const cwd = path.join(configPath, '..')
  exec(config.test, { cwd }, (err, stdout, stderr) => {
    fs.writeFileSync(
      path.join(cwd, './.tcr-feedback'),
      `STDERR\n------\n${stderr}\n\nSTDOUT\n------\n${stdout}`
    )
    if (err) {
      execWithErrorNotification(config.revert, cwd)
    } else {
      execWithErrorNotification(config.commit, cwd)
    }
  })
}

function parseConfig(configPath) {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } catch (err) {
    showErrorNotification({
      message: `atom-tcr failed to parse config at ${configPath}:`,
      detail: err.stack
    })
  }
}

function showErrorNotification({ message, detail }) {
  atom.notifications.addError(message, {
    detail,
    dismissable: true
  })
}

function execWithErrorNotification(command, cwd) {
  exec(command, { cwd }, (err, stdout, stderr) => {
    if (err) {
      showErrorNotification({
        message: `atom-tcr failed running ${command}`,
        detail: stderr.trim() || (err && err.message)
      })
    }
  })
}
