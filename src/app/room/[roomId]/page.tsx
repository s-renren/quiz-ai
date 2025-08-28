import ClientRoom from "@/component/ClientRoom";

type Props = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params;
  return <ClientRoom roomId={roomId} />;
}
