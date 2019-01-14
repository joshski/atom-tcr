# atom-tcr

A simple plugin to automate the
[`test && commit || revert`](https://medium.com/@kentbeck_7670/test-commit-revert-870bbd756864)
workflow in atom.

## Installation

```
apm install atom-tcr
```

## Usage

Save a JSON file named `.tcr` in your project directory, looking something like:

```json
{
  "test": "node test.js",
  "commit": "git add -A && git commit -am working",
  "revert": "git reset --hard"
}
```

When the above configuration file is present, and any file is saved in your
project:

* The `test` command is executed.
* When `test` terminates with exit code 0, `commit` is executed.
* When `test` terminates with any other exit code `revert` is executed.

In either case, `stdout` and `stderr` are written to a file called `./tcr-feedback`
