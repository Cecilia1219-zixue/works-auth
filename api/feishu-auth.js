export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://cecilia1219-zixue.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'missing code' });

  const APP_ID = process.env.FEISHU_APP_ID;
  const APP_SECRET = process.env.FEISHU_APP_SECRET;

  try {
    // 1. 获取 app_access_token
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
    });
    const tokenData = await tokenRes.json();
    const appToken = tokenData.app_access_token;
    if (!appToken) throw new Error('获取app_access_token失败');

    // 2. 用code换用户 access_token
    const userTokenRes = await fetch('https://open.feishu.cn/open-apis/authen/v1/oidc/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + appToken },
      body: JSON.stringify({ grant_type: 'authorization_code', code })
    });
    const userTokenData = await userTokenRes.json();
    const userAccessToken = userTokenData.data?.access_token;
    if (!userAccessToken) throw new Error('获取用户token失败');

    // 3. 获取用户信息
    const userRes = await fetch('https://open.feishu.cn/open-apis/authen/v1/user_info', {
      headers: { 'Authorization': 'Bearer ' + userAccessToken }
    });
    const userData = await userRes.json();
    const user = userData.data;
    if (!user) throw new Error('获取用户信息失败');

    return res.status(200).json({
      success: true,
      name: user.name,
      open_id: user.open_id,
      avatar: user.avatar_url,
      email: user.enterprise_email || user.email || ''
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
