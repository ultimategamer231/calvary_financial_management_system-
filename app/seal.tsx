import Image from "next/image";
export function Seal({ size = 72 }: { size?: number }) {
  return (
    <Image
      src="/church-seal.jpeg"
      width={size}
      height={size}
      alt="Calvary Baptist Church seal"
      className="seal"
      priority
    />
  );
}
