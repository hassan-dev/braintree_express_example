const { Router } = require('express');
const { Transaction } = require('braintree');
const logger = require('debug');
const gateway = require('../lib/gateway');
const axios = require('axios');
var store = require('store');

const router = Router(); // eslint-disable-line new-cap
const debug = logger('braintree_example:router');
const TRANSACTION_SUCCESS_STATUSES = [
  Transaction.Status.Authorizing,
  Transaction.Status.Authorized,
  Transaction.Status.Settled,
  Transaction.Status.Settling,
  Transaction.Status.SettlementConfirmed,
  Transaction.Status.SettlementPending,
  Transaction.Status.SubmittedForSettlement
];

function formatErrors(errors) {
  let formattedErrors = '';

  for (let [, { code, message }] of Object.entries(errors)) {
    formattedErrors += `Error: ${code}: ${message}
`;
  }

  return formattedErrors;
}

function createResultObject({ status }) {
  let result;

  if (TRANSACTION_SUCCESS_STATUSES.indexOf(status) !== -1) {
    result = {
      header: 'Sweet Success!',
      icon: 'success',
      message: 'Your test transaction has been successfully processed. '
    };
  } else {
    result = {
      header: 'Transaction Failed',
      icon: 'fail',
      message: `Your test transaction has a status of ${status}.`
    };
  }

  return result;
}

router.get('/', (req, res) => {
  res.redirect('/checkouts/new');
});

// http://localhost:3000/checkouts/new/?amount=20&uid=5&pid=19&token=123

router.get('/checkouts/new', (req, res) => {
  var _amount = req.query.amount; //either a value or undefined
  var uid = req.query.uid;
  var pid = req.query.pid;
  var token = req.query.token;
  store.set('token', req.query.token);
  store.set('pid', req.query.pid);
  console.log('data: ', _amount, uid, pid, token);
  gateway.clientToken.generate({}).then(({ clientToken }) => {
    res.render('checkouts/new', {
      clientToken,
      _amount,
      messages: req.flash('error')
    });
  });
});

router.get('/checkouts/response/:id', (req, res) => {
  let result;
  const transactionId = req.params.id;

  gateway.transaction.find(transactionId).then(transaction => {
    result = createResultObject(transaction);
    res.render('checkouts/show', { transaction, result });
  });
});

router.post('/checkouts', async (req, res) => {
  // In production you should not take amounts directly from clients
  const { amount, payment_method_nonce: paymentMethodNonce } = req.body;

  gateway.transaction
    .sale({
      amount,
      paymentMethodNonce,
      options: { submitForSettlement: true }
    })
    .then(async result => {
      const { success, transaction } = result;
      var token = store.get('token');
    var someDate = new Date();
someDate.setDate(someDate.getDate() + 15);
var dateFormated = someDate.toISOString().substr(0,10);
alert(dateFormated);
      var payload = {
        payment_method: 'Paypal',
        transaction_id: `${transaction.id}`,
        package_id: `${store.get('pid')}`,
        expire_at: `${dateFormated} 12:00:00`
      };
      console.log(payload);
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;

      await axios.post(
        'https://phplaravel-238332-1180135.cloudwaysapps.com/api/payment',
        payload,
        {
          headers: {
            ContentType: 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      return new Promise((resolve, reject) => {
        if (success || transaction) {
          res.redirect(`checkouts/response/${transaction.id}`);

          resolve();
        }

        reject(result);
      });
    })
    .catch(({ errors }) => {
      const deepErrors = errors.deepErrors();

      debug('errors from transaction.sale %O', deepErrors);

      req.flash('error', { msg: formatErrors(deepErrors) });
      res.redirect('checkouts/new');
    });
});

module.exports = router;
