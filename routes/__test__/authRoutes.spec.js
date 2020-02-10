const supertest = require('supertest');
const { app, mongoose } = require('../../server');
const User = require('../../models/User');

const BASEURL = '/api/auth';
const mockDatabaseName = 'mockUsers';
const mockEmailForRegister = 'admin@gmail.com';
const mockPassword = '1234AAAaaa__';

const DBURL = `mongodb://localhost:27017/${mockDatabaseName}`;

const request = supertest(app);

describe('auth routes', () => {
  beforeAll(async (done) => {
    await mongoose.connection.close();
    await mongoose.connect(DBURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    done();
  });

  it('should return status 409 when user already exist', async () => {
    const res = await request
      .post(`${BASEURL}/register`)
      .send({
        email: mockEmailForRegister,
        password: mockPassword
      })
      .expect({
        message:
          'Такий email вже зайнятий. Спробуйте інший.'
      })
      .expect(409);
  });

  it('should return status 201 when user created', async () => {
    const mockEmail = 'whatever1@gmail.com';
    const res = await request
      .post(`${BASEURL}/register`)
      .send({
        email: mockEmail,
        password: mockPassword
      })
      .expect(201);
    const id = res.body._id;
    await User.findByIdAndDelete(id);
  });

  it('should return status 404 when user not found', async () => {
    const mockEmail = 'whatever1@gmail.com';
    const res = await request
      .post(`${BASEURL}/login`)
      .send({
        email: mockEmail,
        password: mockPassword
      })
      .expect({
        message: 'Користувач з таким email не знайдений.'
      })
      .expect(404);
  });

  it('should return status 401 when password don\'t match', async () => {
    const res = await request
      .post(`${BASEURL}/login`)
      .send({
        email: mockEmailForRegister,
        password:
          '$2a$10$i.0VgohTBtx8arWSKs4/AOY2IFgYbKLjHsDKs8raOHXnLz86HLcQKd'
      })
      .expect({
        message: 'Паролі не збігаються. Спробуйте знову.'
      })
      .expect(401);
  });

  it('should return status 200 when user exist', async () => {
    const res = await request
      .post(`${BASEURL}/login`)
      .send({
        email: mockEmailForRegister,
        password: mockPassword
      })
      .expect(200);
    expect(res.body.token).toBeTruthy();
  });

  it('should validate and get 401 when user non authorized', async () => {
    const res = await request
      .get(`${BASEURL}/validate`)
      .expect(401);
  });

  afterAll(async (done) => {
    await mongoose.connection.close();
    done();
  });
});