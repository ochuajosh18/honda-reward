var express = require('express'),
    router = express.Router({ mergeParams: true });

router.use('/authentication', require('./authentication'));
router.use('/user', require('./user'));
router.use('/membership', require('./membership'));
router.use('/promotion', require('./promotion'));
router.use('/redeemable', require('./redeemable'));
router.use('/transaction', require('./transaction'));
router.use('/serviceReminder', require('./serviceReminder'));
router.use('/generic', require('./generic'));

router.get('/', (req, res) => res.render('login'));

router.get('/:page', (req, res) => res.render(req.params.page));

module.exports = router;
