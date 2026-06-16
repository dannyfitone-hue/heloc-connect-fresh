import ClientStatus from "./status-client";

export default async function StatusPage({params}:{params:Promise<{token:string}>}){
  const { token } = await params;
  return <ClientStatus token={token} />;
}
