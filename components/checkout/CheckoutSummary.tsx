import Image from "next/image";

interface CartItem {
  id:       string;
  quantity: number;
  size:     string;
  color:    string;
  product: {
    id:           string;
    name:         string;
    slug:         string;
    price:        number;
    comparePrice: number | null;
    images:       string[];
    stock:        number;
  };
}

interface Props {
  items:       CartItem[];
  subtotal:    number;
  shipping:    number;
  discount:    number;
  total:       number;
}

export default function CheckoutSummary({
  items, subtotal, shipping, discount, total,
}: Props) {
  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
      <h3 className="font-bold text-gray-900 mb-5">
        Order Summary ({items.length} item{items.length !== 1 ? "s" : ""})
      </h3>

      {/* Items */}
      <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-200 flex-shrink-0">
              <Image
                src={item.product.images?.[0] ?? ""}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="56px"
              />
              {/* Quantity badge */}
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-violet-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                {item.product.name}
              </p>
              <p className="text-xs text-gray-400">
                {item.size} · {item.color}
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                ${(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 border-t border-gray-200 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="text-gray-900">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Shipping</span>
          <span className={shipping === 0 ? "text-green-600 font-medium" : "text-gray-900"}>
            {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Discount</span>
            <span className="text-green-600 font-medium">
              −${discount.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}