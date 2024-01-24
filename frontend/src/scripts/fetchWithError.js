export default function (url, options = {}, timeout = 7000) {
  options.credentials = 'include'
  if (!options.method) options.method = "GET"
  return Promise.race([
    fetch(url, options),
    new Promise((resolve, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout)
    )
  ])
}
