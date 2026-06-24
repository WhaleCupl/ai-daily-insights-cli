# ai-daily-insights (CLI)

Read the **[AI Daily Insights](https://www.aidailyinsights.cn)** briefing right in your terminal.

```bash
npx ai-daily-insights latest
npx ai-daily-insights show 2026-06-24
npx ai-daily-insights search Anthropic
```

Or install globally:

```bash
npm install -g ai-daily-insights
ai-daily-insights latest
```

## Commands

| Command | What it does |
| --- | --- |
| `latest [n]` | List the most recent `n` issues (default 5). |
| `show <date>` | Show one full issue (`YYYY-MM-DD`), every news item + signal. |
| `search <query> [n]` | Keyword search across all issues. |
| `help` | Show usage. |

Data comes from the site's public JSON API — no login, no key.
Set `AI_DAILY_BASE_URL` to point at another deployment.

## Related

- MCP server (for AI agents): [`ai-daily-insights-mcp`](https://www.npmjs.com/package/ai-daily-insights-mcp)

## License

MIT
