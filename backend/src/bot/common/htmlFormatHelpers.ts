export function aLink(url: string) {
    return "<a href='" + url + "'>" + url + "</a>"
}

export function codeBlock(code: string, language: string) {
    return "<pre><code class='language-" + language + "'>" + code + "</code></pre>"
}
