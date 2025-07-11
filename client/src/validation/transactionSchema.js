import * as yup from "yup";

export const transactionSchema = yup.object().shape({
  customerId: yup.mixed().required("اسم الزبون مطلوب"),
  currencyId: yup.mixed().required("العملة مطلوبة"),
  amount: yup
    .number()
    .required("المبلغ مطلوب")
    .positive("المبلغ يجب أن يكون أكبر من صفر"),
  commission: yup.number().min(0, "العمولة يجب أن تكون 0 أو أكبر").nullable(),
  date: yup.date().required("التاريخ مطلوب"),
  note: yup.string(),
});
