import { Refinable } from "../refinable/Refinable";

export const simulateUnsignedTx = async ({
  refinable,
  data,
  to,
  value,
}: {
  refinable: Refinable;
  data: string;
  to: string;
  value: string;
}) => {
  // simulate
  const gasLimit = await refinable.evm.signer.estimateGas({
    data,
    to,
    value,
  });

  const feeData = await refinable.evm.signer.getFeeData();
  const body = {
    network_id: "1",
    from: refinable.accountAddress,
    to: to,
    input: data,
    gas: gasLimit.toNumber() * 2,
    gas_price: feeData.gasPrice.toNumber(),
    value: Number(value),
    save_if_fails: true,
  };

  const resp = await refinable.apiClient.post("simulate/proxy", body);

  return resp;
};
