import { Box } from '@mantine/core';


  // .stamp-wrap svg{
  //   width: 210px; height: 210px;
  //   transform: rotate(-6deg);
  //   filter: drop-shadow(0 6px 14px rgba(30,42,56,0.15));
  // }
  // @media (prefers-reduced-motion: no-preference){
  //   .stamp-wrap svg{ animation: stampIn .5s cubic-bezier(.2,1.4,.4,1) both; }
  //   @keyframes stampIn{
  //     from{ opacity:0; transform: rotate(-6deg) scale(1.4); }
  //     to{ opacity:1; transform: rotate(-6deg) scale(1); }
  //   }
  // }

export default function Stamp({ country, isWon, guessCount }: { country: string; isWon: boolean, guessCount: number }) {

  const color = isWon ? '#2F6349' : '#c4523b';

  return (
    <Box style={{
      display: 'flex',
      margin: '22px 0 8px',
      width: 220,
      height: 220,
      transform: 'rotate(-6deg)',
      filter: 'drop-shadow(0 6px 14px rgba(30,42,56,0.15))'
    }}>
      <svg viewBox="0 0 240 240">
        <defs>
          <path id="arcTop" d="M 34,120 A 86,86 0 0 1 206,120" />
          <path id="arcBottom" d="M 206,132 A 86,86 0 0 1 34,132" />
        </defs>
        <circle cx="120" cy="120" r="98" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 3" opacity="0.55" />
        <circle cx="120" cy="120" r="84" fill="none" stroke={color} strokeWidth="2.5" />
        <text fontFamily="monospace" fontSize="15" fontWeight="600" fill={color} letterSpacing="3">
          <textPath href="#arcTop" startOffset="50%" textAnchor="middle">{country}</textPath>
        </text>
        <text x="120" y="115" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontWeight="700" fontSize="22" fill={color}>{isWon ? 'Found' : 'Failed'}</text>
        <text x="120" y="140" textAnchor="middle" fontFamily="monospace" fontSize="11" fill={color} letterSpacing="1">IN {guessCount} GUESSES</text>
        <text fontFamily="monospace" fontSize="12" fontWeight="600" fill={color} letterSpacing="4">
          <textPath href="#arcBottom" startOffset="50%" textAnchor="middle">GEODLE</textPath>
        </text>
      </svg>
    </Box>
  );
}

