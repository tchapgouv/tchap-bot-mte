export default function (url: string, options: RequestInit = {}, timeout = 7000): Promise<any> {
  options.credentials = 'include'
  if (!options.method) options.method = "GET"
  return Promise.race([
    fetch(url, options),
    new Promise((_resolve, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout)
    )
  ])
}
