const assert = require("node:assert/strict");
const test = require("node:test");
const { __test } = require("../src/controllers/checkoutController");

const purchasedItems = [
  {
    course: { id: "course-1" },
    amountMinor: 80000,
    couponId: "coupon-20",
  },
];

test("pending checkout pricing matches the same coupon and discounted amount", () => {
  const payments = [
    {
      course_id: "course-1",
      amount: "800.00",
      coupon_id: "coupon-20",
    },
  ];

  assert.equal(__test.hasSameCheckoutPricing(payments, purchasedItems), true);
});

test("pending checkout is not reused after the voucher changes", () => {
  const payments = [
    {
      course_id: "course-1",
      amount: "1000.00",
      coupon_id: null,
    },
  ];

  assert.equal(__test.hasSameCheckoutPricing(payments, purchasedItems), false);
});

test("pending checkout is not reused when the discounted amount changes", () => {
  const payments = [
    {
      course_id: "course-1",
      amount: "750.00",
      coupon_id: "coupon-20",
    },
  ];

  assert.equal(__test.hasSameCheckoutPricing(payments, purchasedItems), false);
});
