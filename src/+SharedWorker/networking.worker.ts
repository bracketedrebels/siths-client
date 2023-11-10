/** @format */

onmessage = e => {
  postMessage(e.data * 2)
}

// export default () => {
//   ;(self as any).onconnect = (e: any) => {
//     const port = e.ports[0]

//     port.addEventListener("message", (e: MessageEvent<number>) => {
//       port.postMessage(e.data * 2)
//     })

//     port.start() // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
//   }
// }

export {}
