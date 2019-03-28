const message = (sequelize, DataTypes) => {
    const Message = sequelize.define('message', {
        text: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                     args: true,
                     msg: 'A message has to have a text.',
                }
            }
        }
    })

    Message.associate = models => {
        Message.belongsTo(models.User);
    }

    Message.findById = async (id) => {
        let message = await Message.findOne({
            where: {id}
        })

        return message;
    }

    return Message;
}

export default message;