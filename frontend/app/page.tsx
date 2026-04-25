import Link from "next/link";

export default function HQHome(){
  return(
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Ryan&apos;s AI Projects</h1>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
        <Link href={"/call-assistant"}>
          <button style={{ padding: '15px 30px', cursor: 'pointer' }}>📞 AI Call Assistant</button>
        </Link>
        <Link href={"/badminton"}>
          <button style={{ padding: '15px 30px', cursor: 'pointer' }}>🏸 Badminton Coach</button>        
        </Link>
      </div>
    </div>
  );
}
