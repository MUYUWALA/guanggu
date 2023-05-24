const jsonServer = require('json-server');
const mockData = require('./user.js')();
const jsonwebtoken = require('jsonwebtoken')
// 创建JSON Server实例
const server = jsonServer.create();
const router = jsonServer.router(mockData)
const middlewares = jsonServer.defaults()
// 使用中间件
server.use(middlewares);
server.use(jsonServer.bodyParser);

// 添加自定义路由处理
server.post('/users', (req, res) => {
  const { username, password, op } = req.body;
  const user = mockData.users.find(
    (u) => u.user_name === username && u.user_password === password
  );
  if (user) {
    // 登录成功，生成JWT令牌并返回给客户端
    const token = jsonwebtoken.sign({ username, role: user.user_role }, 'secret');
    res.json({ token, user });
  } else if (!user) {
    // 登录失败，返回错误信息
    res.status(401).json({ error: 'Invalid credentials' });
  } else if (!user && op === 'register') {
    mockData.users.push({
      user_id: mockData.users.filter(item => item.user_type == 'user').reduce((prev, cur) => prev.user_id > cur.user_id ? prev.user_id : cur.user_id),
      user_name: req.body.username,
      user_password: req.body.password,
      user_type: 'user',
      user_onlinestatus: 1,
      user_other: 1
    })
  }
});

// 拦截需要验证的请求，并验证JWT令牌
server.use((req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace('Bearer ', '');
    try {
      const decoded = jsonwebtoken.verify(token, 'secret');
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  } else {
    res.status(401).json({ error: 'Token not provided' });
  }
});

// 将路由挂载到JSON Server实例
server.use(router);

// 启动JSON Server
server.listen(5050, () => {
  console.log('JSON Server is running');
});
