interface Window {
  GraphQLPlayground: any
  version: string
  require: any
}

declare module '*.json' {
  const value: any
  export default value
}
