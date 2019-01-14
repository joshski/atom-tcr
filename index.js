const path = require('path')
const os = require('os')
const fs = require('fs')
const { exec } = require('child_process')
const { CompositeDisposable } = require('atom')

module.exports = {
  activate() {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
      this.subscriptions.add(textEditor.onDidSave(handleDidSave.bind(this)))
    }))
  }
}

function handleDidSave() {
  const localConfigPath = path.join(process.cwd(), '.tcr')
  const homeConfigPath = path.join(os.homedir(), '.tcr')
  if (fs.existsSync(localConfigPath)) {
    execTcr(localConfigPath)
  } else if (fs.existsSync(homeConfigPath)) {
    execTcr(homeConfigPath)
  }
}

function execTcr(configPath) {
  const config = parseConfig(configPath)
  exec(config.test, {}, (err, stdout, stderr) => {
    fs.writeFileSync('./.tcr-feedback', `STDERR\n------\n${stderr}\n\nSTDOUT\n------\n${stdout}`)
    if (err) {
      execWithErrorNotification(config.revert)
    } else {
      execWithErrorNotification(config.commit)
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
    detail, dismissable: true
  })
}

function execWithErrorNotification(command) {
  exec(command, {}, (err, stdout, stderr) => {
    if (err) {
      showErrorNotification({
        message: `atom-tcr failed running ${command}`,
        detail: stderr.trim() || (err && err.message)
      })
    }
  })
}
