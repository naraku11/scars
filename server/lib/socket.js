// Shared Socket.io instance — avoids circular imports in routes
let _io = null

export const setIo  = (io) => { _io = io }
export const emit   = (event, data) => { _io?.emit(event, data) }
export const getIo  = () => _io
