import { combineResolvers } from 'graphql-resolvers';
import Sequelize from 'sequelize';
import { isAuthenticated, isMessageOwner } from './authorization';

export default {
    Query: {
        message: async (parent, { id }, { models }) => {
            return await models.Message.findById(id);
        },
        messages: async (parent, { cursor, limit = 100 }, { models }) => {
            const cursorOptions = cursor ?
                {
                    where: {
                        createdAt: {
                            [Sequelize.Op.lt]: cursor,
                        },
                    },
                } : {};

            return await models.Message.findAll({
                order: [
                    ['createdAt', 'DESC']
                ],
                limit,
                ...cursorOptions
            });
        }
    },
    Mutation: {
        createMessage: combineResolvers(
            isAuthenticated,
            async (parent, { text }, { models, me }) => {
                return await models.Message.create({
                    text,
                    userId: me.id,
                });
            },
        ),
        deleteMessage: combineResolvers(
            isAuthenticated,
            isMessageOwner,
            async (parent, { id }, { models }) => {
                return await models.Message.destroy({ where: { id } });
            },
        ),
    },
    Message: {
        user: async (message, { id }, { me, models }) => {
            return await models.User.findById(message.userId);
        },
    }
};