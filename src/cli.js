#!/usr/bin/env node
const BASE = (process.env.AI_DAILY_BASE_URL || 'https://www.aidailyinsights.cn').replace(/\/$/, '');

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const blue = (s) => c('38;5;63', s);
const magenta = (s) => c('35', s);
const cyan = (s) => c('36', s);
const dim = (s) => c('2', s);
const bold = (s) => c('1', s);

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${res.statusText}`);
  return res.json();
}

function wrap(text, width = 76, indent = '    ') {
  const out = [];
  let line = '';
  // wrap by characters (works for CJK); keep it simple
  for (const ch of text) {
    if (ch === '\n') {
      out.push(line);
      line = '';
      continue;
    }
    line += ch;
    if (line.length >= width) {
      out.push(line);
      line = '';
    }
  }
  if (line) out.push(line);
  return out.map((l) => indent + l).join('\n');
}

async function cmdLatest(n) {
  const limit = Number(n) || 5;
  const index = await getJson('/index.json');
  const posts = (index.posts || []).slice(0, limit);
  console.log('');
  console.log(`${blue('❯')} ${bold('AI Daily Insights')} ${dim('· ls ./news --sort=date')}`);
  console.log(dim('─'.repeat(60)));
  for (const p of posts) {
    console.log(`${magenta(p.date)}  ${bold(p.title)}`);
    console.log(`${dim(p.summary)}`);
    console.log(`${dim('  ' + p.url)}  ${cyan(`[${p.itemCount} items]`)}`);
    console.log('');
  }
  console.log(dim(`tip: ai-daily-insights show ${posts[0]?.date}   ·   ai-daily-insights search <词>`));
  console.log('');
}

async function cmdShow(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    console.error('用法: ai-daily-insights show <YYYY-MM-DD>');
    process.exit(1);
  }
  const a = await getJson(`/${date}.json`);
  console.log('');
  console.log(`${magenta(a.date)} ${dim('·')} ${(a.tags || []).map((t) => cyan('#' + t)).join(' ')}`);
  console.log(`${blue('❯')} ${bold(a.title)}`);
  console.log('');
  for (const item of a.items || []) {
    console.log(`${blue(String(item.index).padStart(2, '0'))}  ${bold(item.title)}`);
    if (item.body) console.log(wrap(item.body));
    if (item.signal) console.log(`    ${cyan('signal:')} ${dim(item.signal)}`);
    console.log('');
  }
  console.log(dim(`${a.url}`));
  console.log('');
}

async function cmdSearch(query, n) {
  if (!query) {
    console.error('用法: ai-daily-insights search <关键词>');
    process.exit(1);
  }
  const limit = Number(n) || 10;
  const index = await getJson('/index.json');
  const q = query.toLowerCase();
  let hits = 0;
  console.log('');
  console.log(`${blue('❯')} grep ${bold(query)} ./news/*`);
  console.log(dim('─'.repeat(60)));
  for (const post of index.posts || []) {
    let a;
    try {
      a = await getJson(`/${post.date}.json`);
    } catch {
      continue;
    }
    for (const item of a.items || []) {
      const hay = `${item.title}\n${item.signal || ''}\n${item.body || ''}`.toLowerCase();
      if (hay.includes(q)) {
        console.log(`${magenta(post.date)}  ${bold(item.title)}`);
        if (item.signal) console.log(`    ${dim(item.signal)}`);
        console.log(dim(`    ${post.url}#${item.index}`));
        console.log('');
        if (++hits >= limit) break;
      }
    }
    if (hits >= limit) break;
  }
  if (!hits) console.log(dim('  没有匹配。'));
  console.log(dim(`${hits} 条结果`));
  console.log('');
}

function help() {
  console.log(`
${blue('❯')} ${bold('AI Daily Insights')}  ${dim('每日 AI 资讯，为人与 Agent 而生')}
${dim('──────────────────────────────────────────────')}
欢迎！这是终端里的每日 AI 资讯工具。${dim('数据来自 ' + BASE + '，无需登录。')}

${bold('▸ 立刻试一下')}
  ${cyan('npx ai-daily-insights latest')}              ${dim('# 看最近 5 期')}

${bold('▸ 全部命令')}
  ${cyan('latest')} ${dim('[n]')}           列出最近 n 期（默认 5）
  ${cyan('show')} ${dim('<日期>')}          看某期全部新闻 + signal，如 ${dim('show 2026-06-24')}
  ${cyan('search')} ${dim('<词> [n]')}      跨期检索关键词
  ${cyan('help')}                  显示本帮助

${bold('▸ 想让你的 AI 直接调用？')}
  装 MCP：${cyan('claude mcp add ai-daily-insights -- npx -y ai-daily-insights-mcp')}

${bold('▸ 喜欢就常用')}
  全局安装：${cyan('npm i -g ai-daily-insights')}  之后直接敲 ${cyan('ai-daily-insights latest')}
`);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  try {
    switch (cmd) {
      case 'latest':
      case 'ls':
        await cmdLatest(rest[0]);
        break;
      case 'show':
      case 'cat':
        await cmdShow(rest[0]);
        break;
      case 'search':
      case 'grep':
        await cmdSearch(rest[0], rest[1]);
        break;
      case undefined:
      case 'help':
      case '-h':
      case '--help':
        help();
        break;
      default:
        console.error(`未知命令: ${cmd}\n`);
        help();
        process.exit(1);
    }
  } catch (err) {
    console.error(`错误: ${err.message}`);
    process.exit(1);
  }
}

main();
