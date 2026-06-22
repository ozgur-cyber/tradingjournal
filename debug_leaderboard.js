import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjfxuqmpntykfheoxorp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZnh1cW1wbnR5a2ZoZW94b3JwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUyMDMzMSwiZXhwIjoyMDk3MDk2MzMxfQ.Uu8lve0GHUNsFSxscbqJQSmye8-9cde7F4MeMxmWgwo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching settings...");
  let maxPnL = 10000;
  let pnlWeight = 0.40;
  let winRateWeight = 0.25;
  let rrWeight = 0.20;
  let consistencyWeight = 0.15;
  let minTrades = 0;

  const { data: settingsData } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (settingsData) {
    maxPnL = Number(settingsData.max_pnl ?? 10000);
    pnlWeight = Number(settingsData.pnl_weight ?? 0.40);
    winRateWeight = Number(settingsData.win_rate_weight ?? 0.25);
    rrWeight = Number(settingsData.rr_weight ?? 0.20);
    consistencyWeight = Number(settingsData.consistency_weight ?? 0.15);
    minTrades = Number(settingsData.min_trades ?? 0);
    console.log("Settings loaded:", settingsData);
  }

  console.log("Fetching users...");
  const { data: users } = await supabase.from('users').select('*');
  console.log("Fetching trades...");
  const { data: trades } = await supabase.from('trades').select('*');

  const userTradesMap = new Map();
  trades.forEach(t => {
    if (!userTradesMap.has(t.user_id)) userTradesMap.set(t.user_id, []);
    userTradesMap.get(t.user_id).push(t);
  });

  const detailedUsers = users.map(u => {
    const userTrades = userTradesMap.get(u.id) || [];
    const totalPnL = userTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
    const totalTrades = userTrades.length;

    if (totalTrades === 0) return null;

    const winTrades = userTrades.filter(t => Number(t.pnl) > 0).length;
    const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
    
    const totalRR = userTrades.reduce((sum, t) => sum + (Number(t.risk_reward) || 0), 0);
    const avgRR = totalTrades > 0 ? totalRR / totalTrades : 0;

    const pnlScore = Math.min((totalPnL / maxPnL) * 100, 100) * pnlWeight;
    const winRateScore = winRate * winRateWeight;
    const rrScore = Math.min(avgRR * 10, 100) * rrWeight;
    const consistencyScore = Math.min(totalTrades * 5, 100) * consistencyWeight;
    const weightedScore = pnlScore + winRateScore + rrScore + consistencyScore;

    return {
      username: u.username,
      totalPnL,
      totalTrades,
      winRate,
      avgRR,
      pnlScore,
      winRateScore,
      rrScore,
      consistencyScore,
      weightedScore
    };
  }).filter(Boolean);

  detailedUsers.sort((a, b) => b.weightedScore - a.weightedScore);

  console.log("\nLeaderboard Standings:");
  detailedUsers.forEach((u, idx) => {
    console.log(`${idx + 1}. ${u.username}:
      Total PnL: ${u.totalPnL} (pnlScore: ${u.pnlScore.toFixed(2)})
      Total Trades: ${u.totalTrades} (consistencyScore: ${u.consistencyScore.toFixed(2)})
      Win Rate: ${u.winRate.toFixed(1)}% (winRateScore: ${u.winRateScore.toFixed(2)})
      Avg R:R: ${u.avgRR.toFixed(2)} (rrScore: ${u.rrScore.toFixed(2)})
      Weighted Score: ${u.weightedScore.toFixed(2)}
    `);
  });
}

main();
