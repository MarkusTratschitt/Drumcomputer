declare namespace NodeJS {
  interface Process {
    dev?: boolean
    client?: boolean
  }
}

declare const process: NodeJS.Process
