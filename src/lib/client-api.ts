export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const data = await response
      .clone()
      .json()
      .catch(() => null);
    throw new Error(
      data?.error || `Request failed (${response.status}). Please try again.`,
    );
  }
  return response;
}
