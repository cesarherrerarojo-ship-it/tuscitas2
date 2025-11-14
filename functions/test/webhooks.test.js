// functions/test/webhooks.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const admin = require('firebase-admin');
const test = require('firebase-functions-test')();

// Mock Stripe
const stripeMock = {
  webhooks: {
    constructEvent: sinon.stub()
  },
  subscriptions: {
    retrieve: sinon.stub()
  }
};

// Load functions with mocked Stripe
const proxyquire = require('proxyquire').noCallThru();
const myFunctions = proxyquire('../index', {
  'stripe': () => stripeMock
});

describe('Payment Webhooks', () => {
  let adminStub;
  let firestoreStub;
  let authStub;

  before(() => {
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp();
    }
  });

  beforeEach(() => {
    // Reset all stubs
    sinon.reset();

    // Mock Firestore
    firestoreStub = {
      collection: sinon.stub().returnsThis(),
      doc: sinon.stub().returnsThis(),
      get: sinon.stub(),
      set: sinon.stub().resolves(),
      update: sinon.stub().resolves()
    };

    adminStub = sinon.stub(admin, 'firestore').returns(firestoreStub);
    authStub = sinon.stub(admin, 'auth').returns({
      getUser: sinon.stub().resolves({ uid: 'test-user' }),
      setCustomClaims: sinon.stub().resolves()
    });
  });

  afterEach(() => {
    adminStub.restore();
    authStub.restore();
  });

  after(() => {
    test.cleanup();
  });

  describe('Stripe Webhook', () => {
    describe('customer.subscription.created', () => {
      it('should activate membership when subscription is created', async () => {
        const subscriptionEvent = {
          id: 'sub_test123',
          object: 'subscription',
          status: 'active',
          metadata: {
            userId: 'user123',
            plan: 'monthly'
          },
          items: {
            data: [{
              price: {
                unit_amount: 2999 // €29.99
              }
            }]
          },
          currency: 'eur',
          current_period_start: 1700000000,
          current_period_end: 1702592000,
          cancel_at_period_end: false
        };

        stripeMock.webhooks.constructEvent.returns({
          type: 'customer.subscription.created',
          data: { object: subscriptionEvent }
        });

        // Mock request/response
        const req = {
          headers: { 'stripe-signature': 'test-sig' },
          rawBody: Buffer.from('test')
        };
        const res = {
          json: sinon.stub(),
          status: sinon.stub().returnsThis(),
          send: sinon.stub()
        };

        // Mock Firestore user doc
        firestoreStub.get.resolves({
          exists: true,
          data: () => ({ uid: 'user123', gender: 'masculino' })
        });

        // Call webhook
        await myFunctions.stripeWebhook(req, res);

        // Assertions
        expect(res.json.calledOnce).to.be.true;
        expect(res.json.calledWith({ received: true })).to.be.true;

        // Verify Firestore update was called
        expect(firestoreStub.update.called).to.be.true;

        // Verify subscription was logged
        expect(firestoreStub.set.called).to.be.true;
      });

      it('should reject webhook with invalid signature', async () => {
        stripeMock.webhooks.constructEvent.throws(new Error('Invalid signature'));

        const req = {
          headers: { 'stripe-signature': 'invalid-sig' },
          rawBody: Buffer.from('test')
        };
        const res = {
          json: sinon.stub(),
          status: sinon.stub().returnsThis(),
          send: sinon.stub()
        };

        await myFunctions.stripeWebhook(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        expect(res.send.called).to.be.true;
      });

      it('should handle missing userId in metadata', async () => {
        const subscriptionEvent = {
          id: 'sub_test456',
          status: 'active',
          metadata: {}, // No userId
          items: { data: [{ price: { unit_amount: 2999 } }] },
          currency: 'eur',
          current_period_start: 1700000000,
          current_period_end: 1702592000
        };

        stripeMock.webhooks.constructEvent.returns({
          type: 'customer.subscription.created',
          data: { object: subscriptionEvent }
        });

        const req = {
          headers: { 'stripe-signature': 'test-sig' },
          rawBody: Buffer.from('test')
        };
        const res = {
          json: sinon.stub(),
          status: sinon.stub().returnsThis(),
          send: sinon.stub()
        };

        await myFunctions.stripeWebhook(req, res);

        // Should still return 200 but not update Firestore
        expect(res.json.calledWith({ received: true })).to.be.true;
        expect(firestoreStub.update.called).to.be.false;
      });
    });

    describe('customer.subscription.deleted', () => {
      it('should deactivate membership when subscription is canceled', async () => {
        const subscriptionEvent = {
          id: 'sub_test123',
          status: 'canceled',
          metadata: {
            userId: 'user123'
          }
        };

        stripeMock.webhooks.constructEvent.returns({
          type: 'customer.subscription.deleted',
          data: { object: subscriptionEvent }
        });

        const req = {
          headers: { 'stripe-signature': 'test-sig' },
          rawBody: Buffer.from('test')
        };
        const res = {
          json: sinon.stub(),
          status: sinon.stub().returnsThis()
        };

        await myFunctions.stripeWebhook(req, res);

        expect(res.json.calledWith({ received: true })).to.be.true;
        expect(firestoreStub.update.called).to.be.true;

        // Verify hasActiveSubscription was set to false
        const updateCall = firestoreStub.update.getCall(0);
        expect(updateCall.args[0].hasActiveSubscription).to.be.false;
        expect(updateCall.args[0].subscriptionStatus).to.equal('canceled');
      });
    });

    describe('payment_intent.succeeded', () => {
      it('should activate insurance when payment succeeds', async () => {
        const paymentIntent = {
          id: 'pi_test123',
          amount: 12000, // €120.00
          currency: 'eur',
          status: 'succeeded',
          payment_method_types: ['card'],
          metadata: {
            userId: 'user123',
            paymentType: 'insurance'
          }
        };

        stripeMock.webhooks.constructEvent.returns({
          type: 'payment_intent.succeeded',
          data: { object: paymentIntent }
        });

        const req = {
          headers: { 'stripe-signature': 'test-sig' },
          rawBody: Buffer.from('test')
        };
        const res = {
          json: sinon.stub(),
          status: sinon.stub().returnsThis()
        };

        await myFunctions.stripeWebhook(req, res);

        expect(res.json.calledWith({ received: true })).to.be.true;

        // Verify insurance activation
        expect(firestoreStub.update.called).to.be.true;
        const updateCall = firestoreStub.update.getCall(0);
        expect(updateCall.args[0].hasAntiGhostingInsurance).to.be.true;
        expect(updateCall.args[0].insurancePaymentId).to.equal('pi_test123');
        expect(updateCall.args[0].insuranceAmount).to.equal(120);
      });

      it('should not activate insurance for non-insurance payments', async () => {
        const paymentIntent = {
          id: 'pi_test456',
          amount: 2999,
          currency: 'eur',
          status: 'succeeded',
          metadata: {
            userId: 'user123',
            paymentType: 'other' // Not insurance
          }
        };

        stripeMock.webhooks.constructEvent.returns({
          type: 'payment_intent.succeeded',
          data: { object: paymentIntent }
        });

        const req = {
          headers: { 'stripe-signature': 'test-sig' },
          rawBody: Buffer.from('test')
        };
        const res = {
          json: sinon.stub(),
          status: sinon.stub().returnsThis()
        };

        await myFunctions.stripeWebhook(req, res);

        expect(res.json.calledWith({ received: true })).to.be.true;
        // Should not update insurance fields
        expect(firestoreStub.update.called).to.be.false;
      });
    });

    describe('invoice.payment_failed', () => {
      it('should mark subscription as past_due when invoice payment fails', async () => {
        const invoice = {
          id: 'in_test123',
          subscription: 'sub_test123',
          amount_due: 2999,
          currency: 'eur'
        };

        stripeMock.subscriptions.retrieve.resolves({
          id: 'sub_test123',
          metadata: { userId: 'user123' }
        });

        stripeMock.webhooks.constructEvent.returns({
          type: 'invoice.payment_failed',
          data: { object: invoice }
        });

        const req = {
          headers: { 'stripe-signature': 'test-sig' },
          rawBody: Buffer.from('test')
        };
        const res = {
          json: sinon.stub(),
          status: sinon.stub().returnsThis()
        };

        await myFunctions.stripeWebhook(req, res);

        expect(res.json.calledWith({ received: true })).to.be.true;

        // Verify subscription status was updated to past_due
        expect(firestoreStub.update.called).to.be.true;
        const updateCall = firestoreStub.update.getCall(0);
        expect(updateCall.args[0].subscriptionStatus).to.equal('past_due');
        expect(updateCall.args[0].hasActiveSubscription).to.be.false;
      });
    });
  });

  describe('PayPal Webhook', () => {
    describe('BILLING.SUBSCRIPTION.ACTIVATED', () => {
      it('should activate membership when PayPal subscription is activated', async () => {
        const event = {
          event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
          resource: {
            id: 'I-TEST123',
            custom_id: 'user123',
            billing_info: {
              last_payment: {
                amount: {
                  value: '29.99',
                  currency_code: 'EUR'
                }
              },
              next_billing_time: '2024-12-20T00:00:00Z'
            }
          }
        };

        const req = {
          body: event
        };
        const res = {
          json: sinon.stub(),
          status: sinon.stub().returnsThis()
        };

        await myFunctions.paypalWebhook(req, res);

        expect(res.json.calledWith({ received: true })).to.be.true;

        // Verify membership activation
        expect(firestoreStub.update.called).to.be.true;
        const updateCall = firestoreStub.update.getCall(0);
        expect(updateCall.args[0].hasActiveSubscription).to.be.true;
        expect(updateCall.args[0].subscriptionId).to.equal('I-TEST123');
      });

      it('should handle missing custom_id gracefully', async () => {
        const event = {
          event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
          resource: {
            id: 'I-TEST456',
            // No custom_id
            billing_info: {
              last_payment: {
                amount: {
                  value: '29.99',
                  currency_code: 'EUR'
                }
              }
            }
          }
        };

        const req = { body: event };
        const res = {
          json: sinon.stub(),
          status: sinon.stub().returnsThis()
        };

        await myFunctions.paypalWebhook(req, res);

        expect(res.json.calledWith({ received: true })).to.be.true;
        expect(firestoreStub.update.called).to.be.false;
      });
    });

    describe('PAYMENT.SALE.COMPLETED', () => {
      it('should activate insurance when PayPal payment completes', async () => {
        const event = {
          event_type: 'PAYMENT.SALE.COMPLETED',
          resource: {
            id: 'SALE-TEST123',
            custom: 'user123',
            description: 'insurance',
            amount: {
              total: '120.00',
              currency: 'EUR'
            }
          }
        };

        const req = { body: event };
        const res = {
          json: sinon.stub(),
          status: sinon.stub().returnsThis()
        };

        await myFunctions.paypalWebhook(req, res);

        expect(res.json.calledWith({ received: true })).to.be.true;

        // Verify insurance activation
        expect(firestoreStub.update.called).to.be.true;
        const updateCall = firestoreStub.update.getCall(0);
        expect(updateCall.args[0].hasAntiGhostingInsurance).to.be.true;
        expect(updateCall.args[0].insurancePaymentId).to.equal('SALE-TEST123');
        expect(updateCall.args[0].insuranceAmount).to.equal(120);
      });
    });
  });
});
