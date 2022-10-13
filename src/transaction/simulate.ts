import { Refinable } from "../refinable/Refinable";

export const simulateUnsignedTx = async (
  {
    refinable,
    data,
    to,
    value,
  }: {
    refinable: Refinable;
    data: string;
    to: string;
    value: string;
  },
  { chainId = 1 }: { chainId?: number } = {}
) => {
  const body = {
    network_id: chainId ? String(chainId) : "1",
    from: refinable.accountAddress,
    to: to,
    input: data,
    value: Number(value),
    save_if_fails: true,
  };

  const resp = await refinable.apiClient.post("simulate/proxy", body);

  return resp;
};
