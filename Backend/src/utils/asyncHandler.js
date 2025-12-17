const asyncHandler = (func) => {
    return (req, res, next) => {     
        Promise.resolve(func(req, res, next)).catch((error) => {
            console.log('Error caught in asyncHandler:', error.message);
            next(error);
        });
    }
}
export { asyncHandler }