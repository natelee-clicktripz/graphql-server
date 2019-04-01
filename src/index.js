import express from 'express';
import jwt from 'jsonwebtoken';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import cors from 'cors';
import bodyParser from 'body-parser';

import schema from './schema';
import resolvers from './resolvers';
import models, { sequelize } from './models';

require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    formatErrors: error => {
        const message = error.message.replace('SequelizeValidateErrors: ', '').replace('Validation error: ', '');

        return {
            ...error,
            message
        }
    },
    context: async ({req}) => {
        const me = await getMe(req);

        return {
            models,
            me,
            secret: process.env.SECRET,
        }
    },
});

const getMe = async req => {
  const token = req.headers['x-token'];

  if (token) {
    try {
      return await jwt.verify(token, process.env.SECRET);
    } catch (e) {
      throw new AuthenticationError(
        'Your session expired. Sign in again.',
      );
    }
  }
};

server.applyMiddleware({ app, path: '/graphql' });

const eraseDatabaseOnSync = true;

sequelize.sync({ force: eraseDatabaseOnSync }).then(async () => {
    if (eraseDatabaseOnSync && process.env.NODE_ENV === 'development') {
        createUsersWithMessages(new Date());
    }

    app.listen({ port: 8000 }, () => {
        console.log('Apollo Server on http://localhost:8000/graphql');
    });
});

const createUsersWithMessages = async (date) => {
    await models.User.create({
        username: 'rwieruch',
        email: 'hello@robin.com',
        password: 'rwieruch',
        role: 'ADMIN',
        messages: [{
            text: 'Published the Road to learn React',
            createdAt: date.setSeconds(date.getSeconds() + 1),
        }, ],
    }, {
        include: [models.Message],
    }, );

    await models.User.create({
        username: 'ddavids',
        email: 'hello@david.com',
        password: 'ddavids',
        messages: [{
                text: 'Happy to release ...',
                createdAt: date.setSeconds(date.getSeconds() + 1),
            },
            {
                text: 'Published a complete ...',
                createdAt: date.setSeconds(date.getSeconds() + 1),
            },
        ],
    }, {
        include: [models.Message],
    }, );
};