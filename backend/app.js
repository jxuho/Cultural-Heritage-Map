// 1. 환경 변수 로드 (항상 최상단)
require('dotenv').config();
// 2. 핵심 Node.js/Express 프레임워크 및 미들웨어 (내장/공통)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// 3. 서드파티 미들웨어 
const cookieParser = require('cookie-parser');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
// 4. 모델 파일 (스키마 정의)
// 라우트나 컨트롤러에서 모델을 참조하기 전에 먼저 정의되어야 합니다.
require('./models/User');
require('./models/CulturalSite');
require('./models/Review');
// 5. 유틸리티 파일 (애플리케이션 전반에 사용되는 헬퍼 함수/클래스)
const AppError = require('./utils/AppError')
// 6. 컨트롤러 파일 (라우터에서 사용될 비즈니스 로직)
const errorController = require('./controllers/errorController')
// 7. Passport 설정 파일 (전략 정의)
// Passport 전략을 정의하고 초기화하는 부분이므로 라우터 전에 로드되어야 합니다.
require('./config/passport');
// 8. 라우터 파일 (API 엔드포인트 정의)
// 모든 모델, 유틸리티, 인증 설정 등이 로드된 후 라우터가 정의되어야 합니다.
const culturalSitesRoutes = require('./routes/culturalSitesRoutes')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes');
const proposalRoutes = require('./routes/proposalRoutes');

// chemnitz boundary 로드
const { loadChemnitzBoundary } = require('./utils/locationUtils');

// cron 관련 파일(스케줄링)
const cron = require('node-cron');
const { overpassUpdater } = require('./services/overpassService')

// Swagger 관련 패키지
const path = require('path');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');



const app = express();

app.set('trust proxy', 1);
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// API 속도 제한 (동일 IP에서 1시간 동안 1000회 요청으로 제한)
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request on this ip.',
});
app.use('/api', limiter); // /api로 시작하는 모든 라우트에 적용


const allowedOrigins = [
  'https://chemnitz-cultural-sites.onrender.com',
  'http://localhost:5173', // Vite 기본 포트
  'http://localhost:3000'
];

app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(cookieParser())
app.use(express.static(`${__dirname}/public`));
app.use(passport.initialize());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/cultural-sites', culturalSitesRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/proposals', proposalRoutes);

// Swagger UI 라우트 추가
const swaggerDocument = YAML.load(path.join(__dirname, 'public/openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 프론트 빌드 파일 경로
const frontendPath = path.join(__dirname, '../frontend/dist');

// 정적 파일 서빙
app.use(express.static(frontendPath));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(frontendPath, 'index.html'));
// });
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// app.get('/', (req, res) => {
//   res.send('Message from the server: Server is Running!');
// });

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorController);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');

    // chemnitz boundary 로드
    try {
      loadChemnitzBoundary();
      console.log('Chemnitz boundary data loaded successfully.');
    } catch (error) {
      console.error('Failed to load Chemnitz boundary data:', error);
      // 경계 데이터 로드에 실패하면 서버를 시작하지 않거나,
      // 적절한 오류 처리 로직을 추가할 수 있습니다.
      // process.exit(1); // 치명적인 오류로 간주하고 앱 종료
    }

    // cron 스케줄러 실행
    cron.schedule('0 0 * * 0', async () => {
      console.log('weekly Overpass data update task started...');
      try {
        await overpassUpdater();
        console.log('weekly Overpass data update task completed successfully.');
      } catch (error) {
        console.error('Error during weekly Overpass data update task:', error);
      }
    }, {
      scheduled: true, // 스케줄을 즉시 활성화합니다.
      timezone: "Europe/Berlin" // Chemnitz는 베를린 시간대이므로 명시적으로 지정합니다. 필요에 따라 변경.
    });
    console.log('Overpass data update scheduled for every Sunday 00:00.');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });