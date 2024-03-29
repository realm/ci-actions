import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const context = github.context
    if (!context || !context.payload || !context.payload.pull_request) {
      return
    }

    if (context.payload.pull_request.draft) {
      core.info(`Skipping title check because PR is in draft.`)
      return
    }

    const title = context.payload.pull_request.title
    const labels = context.payload.pull_request.labels

    const ignoreLabels = core
      .getInput('ignore-labels', { required: false })
      .split(',')

    for (const label of labels) {
      for (const ignoreLabel of ignoreLabels) {
        if (label.name === ignoreLabel) {
          core.info(`Skipping title check because PR has label: '${label}'.`)
          return
        }
      }
    }

    const regexText = core.getInput('regex', { required: true })

    const regex = new RegExp(regexText)
    if (!regex.test(title)) {
      const errorMessage =
        core.getInput('error-hint', { required: false }) ||
        `Failed to match PR title '${title}' against supplied regex: '${regexText}'`
      core.setFailed(errorMessage)
      return
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}
