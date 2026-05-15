"use client";

import { useState } from "react";

import CreateOrder from "./CreateOrder";
import FreshOrdersAcceptedForm from "../request/FreshOrdersAcceptedForm";
import StockAcceptedForm from "../request/StockAcceptedForm";
import { Button } from "@/components/ui/button";

const EditOrderAction = ({
  order,
  customers,
}: {
  order: any;
  customers: any[];
}) => {
  const [openEdit, setOpenEdit] = useState(false);

  if (!openEdit) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpenEdit(true)}
      >
        Edit
      </Button>
    );
  }

  if (order.orderSource === "regular") {
    return (
      <CreateOrder
        customers={customers}
        ordersTotalCount={0}
        editOrder={order}
        triggerLabel="Edit"
      />
    );
  }

  if (order.orderType === "Stock") {
    const stockOrderId = order.Stock_order?.id ?? order.stockId;

    if (!stockOrderId) {
      return (
        <Button variant="outline" disabled>
          Edit
        </Button>
      );
    }

    return (
      <StockAcceptedForm
        id={stockOrderId}
        editMode
        retailerOrderId={order.id}
        editOrder={order}
        triggerLabel="Edit"
      />
    );
  }

  if (order.favouriteOrder?.id) {
    return (
      <FreshOrdersAcceptedForm
        customers={customers}
        id={order.favouriteOrder.id}
        editMode
        retailerOrderId={order.id}
        editOrder={order}
        triggerLabel="Edit"
      />
    );
  }

  return (
    <Button variant="outline" disabled>
      Edit
    </Button>
  );
};

export default EditOrderAction;