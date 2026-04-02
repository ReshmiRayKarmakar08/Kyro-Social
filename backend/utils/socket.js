let ioRef = null;

const setIO = (io) => {
  ioRef = io;
};

const getIO = () => ioRef;

module.exports = {
  setIO,
  getIO,
};
