import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

function matchBalancedBraces(str, start) {
  if (str[start] !== '{') return null
  let depth = 0
  for (let i = start; i < str.length; i++) {
    if (str[i] === '{') depth++
    else if (str[i] === '}') {
      depth--
      if (depth === 0) return str.slice(start, i + 1)
    }
  }
  return null
}

function extractLatexCommand(text, pos) {
  if (text[pos] !== '\\') return null
  let end = pos + 1
  while (end < text.length && /[a-zA-Z]/.test(text[end])) end++
  if (end === pos + 1) return null

  let result = text.slice(pos, end)
  let cursor = end
  while (cursor < text.length && text[cursor] === '{') {
    const br = matchBalancedBraces(text, cursor)
    if (!br) break
    result += br
    cursor += br.length
  }
  return { text: result, end: cursor }
}

const LATEX_CMD = /^\\(?:frac|boxed|sqrt|text|left|right|cdot|times|pm|leq|geq|neq|infty|alpha|beta|pi|theta|sum|int|lim|overline|underline|vec|hat|bar)\b/

/** Wrap bare LaTeX commands (not already inside $...$) in inline math delimiters. */
function wrapBareLatex(text) {
  const segments = []
  let i = 0

  while (i < text.length) {
    if (text[i] === '$') {
      const isDisplay = text[i + 1] === '$'
      const close = isDisplay ? '$$' : '$'
      const searchFrom = i + close.length
      const end = text.indexOf(close, searchFrom)
      if (end !== -1) {
        segments.push(text.slice(i, end + close.length))
        i = end + close.length
        continue
      }
    }

    if (text[i] === '\\' && LATEX_CMD.test(text.slice(i))) {
      const cmd = extractLatexCommand(text, i)
      if (cmd) {
        segments.push(`$${cmd.text}$`)
        i = cmd.end
        continue
      }
    }

    const nextSpecial = (() => {
      let j = i + 1
      while (j < text.length) {
        if (text[j] === '$' || (text[j] === '\\' && LATEX_CMD.test(text.slice(j)))) return j
        j++
      }
      return text.length
    })()

    segments.push(text.slice(i, nextSpecial))
    i = nextSpecial
  }

  return segments.join('')
}

function normalizeMath(text) {
  return wrapBareLatex(
    text
      .replace(/\\\[([\s\S]*?)\\\]/g, (_, expr) => `$$\n${expr.trim()}\n$$`)
      .replace(/\\\(([\s\S]*?)\\\)/g, (_, expr) => `$${expr.trim()}$`)
  )
}

export default function RichText({ text, className = '' }) {
  if (!text) return null

  return (
    <div className={`rich-text ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizeMath(text)}
      </ReactMarkdown>
    </div>
  )
}
