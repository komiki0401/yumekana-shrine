"""Original, transparent SVG illustrations for Yumekana Shrine. No third-party assets.
Run with Python 3 to regenerate the forty vector files; runtime has no Python dependency.
"""
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'src/assets/encounters'
ART = {}
DEFS = '''<defs>
<linearGradient id="cream" x2=".8" y2="1"><stop stop-color="#fff9eb"/><stop offset="1" stop-color="#e9d8bb"/></linearGradient>
<linearGradient id="gold" x2=".7" y2="1"><stop stop-color="#fff1bd"/><stop offset=".5" stop-color="#dfbc78"/><stop offset="1" stop-color="#b99058"/></linearGradient>
<linearGradient id="pink" x2="1" y2="1"><stop stop-color="#fff0ee"/><stop offset="1" stop-color="#d9a5bd"/></linearGradient>
<linearGradient id="mist" x2="1" y2="1"><stop stop-color="#d3ebe1"/><stop offset=".5" stop-color="#e3d9f2"/><stop offset="1" stop-color="#f5d8d9"/></linearGradient>
<radialGradient id="halo"><stop stop-color="#fff7d4" stop-opacity=".8"/><stop offset=".55" stop-color="#f8e5b5" stop-opacity=".24"/><stop offset="1" stop-color="#fff3d1" stop-opacity="0"/></radialGradient>
</defs>'''

def star(x, y, r=7, color='#e5c88b'):
    return f'<path d="M{x} {y-r}Q{x+1} {y-1} {x+r} {y}Q{x+1} {y+1} {x} {y+r}Q{x-1} {y+1} {x-r} {y}Q{x-1} {y-1} {x} {y-r}Z" fill="{color}"/>'

def flower(x, y, r=12, color='#edbdca'):
    petals=''.join(f'<ellipse cx="{x}" cy="{y-r*.55}" rx="{r*.4}" ry="{r*.62}" transform="rotate({n*72} {x} {y})"/>' for n in range(5))
    return f'<g fill="{color}">{petals}<circle cx="{x}" cy="{y}" r="{r*.2}" fill="#dfbc78"/></g>'

def eyes(x, y, gap=22):
    return f'<path d="M{x-gap-5} {y}q5 6 10 0M{x+gap-5} {y}q5 6 10 0" fill="none" stroke="#806b65" stroke-width="3"/><path d="M{x-4} {y+12}q4 5 8 0" fill="none" stroke="#b68b87" stroke-width="2"/>'

def ground(): return '<ellipse cx="242" cy="313" rx="123" ry="12" fill="#9a8768" opacity=".12"/>'

def cat(walking=False):
    if walking:
        return ground()+'''<path d="M115 248Q39 226 70 167Q85 139 97 157Q76 195 126 203" fill="none" stroke="#ac8b72" stroke-width="24"/>
<path d="M126 233L133 307H157L169 250M241 234L255 307H280L275 227" fill="url(#cream)" stroke="#c5aa8f" stroke-width="2"/>
<ellipse cx="195" cy="225" rx="100" ry="57" fill="url(#cream)"/>
<path d="M111 215Q135 167 173 174L178 220Q141 242 111 215" fill="#d1a16e"/><path d="M194 176Q238 163 261 194L241 226Q211 211 194 176" fill="#9c8277"/>
<path d="M256 153L254 101L289 126L320 103L325 161Q331 216 291 219Q247 214 256 153" fill="url(#cream)" stroke="#c8ab94" stroke-width="2"/>
<path d="M256 151L255 104L287 127L278 164" fill="#aa8879"/><path d="M298 130L318 107L320 153" fill="#d7a578"/>'''+eyes(289,169,16)+'''<path d="M251 184l-23-4m22 11l-24 5m96-12l23-4m-23 11l24 5" stroke="#ad9687" stroke-width="2"/>'''
    return ground()+'''<path d="M282 276Q357 298 350 244Q346 221 331 233Q348 272 284 248" fill="url(#cream)" stroke="#c8bba3" stroke-width="2"/>
<path d="M197 182Q169 239 181 291Q190 313 238 308Q289 312 300 290Q307 245 277 184" fill="url(#cream)" stroke="#c8bba3" stroke-width="2"/>
<path d="M210 243L205 299M261 243L268 299" stroke="#c8bba3" stroke-width="3" fill="none"/>
<path d="M178 145L174 82L217 106Q243 94 267 106L308 83L304 146Q317 198 242 207Q169 198 178 145" fill="url(#cream)" stroke="#c8bba3" stroke-width="2"/>
<path d="M184 121L182 94L207 111M280 111L300 94L299 124" fill="#efc4cc"/>
<ellipse cx="199" cy="165" rx="12" ry="5" fill="#ecc5cd"/><ellipse cx="283" cy="165" rx="12" ry="5" fill="#ecc5cd"/>'''+eyes(242,148,25)+'''<path d="M173 163l-28-7m30 16l-28 5m159-14l28-7m-30 16l28 5" stroke="#c6b6a0" stroke-width="2"/>'''
ART['whiteCat']=cat()
ART['calicoCat']=cat(True)

def fox(white=False):
    fur='url(#cream)' if white else '#d8ac83'
    return ground()+f'''<path d="M213 258Q95 332 59 243Q31 176 89 144Q78 209 149 194Q191 190 218 229" fill="{fur}" stroke="#b9a38e" stroke-width="2"/>
<path d="M59 243Q34 180 89 144Q79 189 108 200Q86 229 59 243" fill="#fff6e6"/>
<path d="M201 183Q165 252 196 300H284Q303 257 282 202" fill="{fur}" stroke="#b9a38e" stroke-width="2"/>
<path d="M221 236L213 302M266 238L278 302" stroke="#b69c85" stroke-width="3"/>
<path d="M217 123L222 64L260 107L290 73L312 147L302 193L268 211L226 177Z" fill="{fur}" stroke="#b9a38e" stroke-width="2"/>
<path d="M223 85L227 124L245 113M289 94L276 117L301 137" fill="#d9acb5"/>
<path d="M225 148Q240 173 265 168Q285 150 309 153L300 189L268 210L235 185Z" fill="#fff7e9"/>
<path d="M235 144q10 8 17 0M279 142q9 8 16-1" stroke="#8f7369" stroke-width="3" fill="none"/>
<path d="M264 177l7 0l-4 5Z" fill="#93766f"/>
<path d="M224 212Q257 230 285 213L277 232L240 245Z" fill="{'#d9b67a' if white else '#e8c5c8'}"/>
''' + (flower(265,128,9,'#d9b77a')+star(111,113,9)+star(341,206,7) if white else '')
ART['fox']=fox()
ART['sacredWhiteFox']=fox(True)
ART['tanuki']=ground()+'''<ellipse cx="242" cy="246" rx="85" ry="65" fill="#b39a82"/><ellipse cx="244" cy="257" rx="49" ry="48" fill="#ead8bd"/>
<ellipse cx="184" cy="304" rx="24" ry="9" fill="#8f7c6b"/><ellipse cx="297" cy="304" rx="24" ry="9" fill="#8f7c6b"/>
<circle cx="183" cy="115" r="26" fill="#ae937c"/><circle cx="302" cy="115" r="26" fill="#ae937c"/>
<ellipse cx="243" cy="164" rx="85" ry="66" fill="url(#cream)"/><ellipse cx="204" cy="163" rx="26" ry="23" fill="#9c8172"/><ellipse cx="281" cy="163" rx="26" ry="23" fill="#9c8172"/>
<path d="M195 164q9 6 17 0m60 0q9 6 17 0" stroke="#fff8ee" stroke-width="3" fill="none"/>
<ellipse cx="243" cy="192" rx="10" ry="7" fill="#8b766c"/>
<path d="M242 108Q205 60 266 65Q299 87 242 108" fill="#a7b79a"/><path d="M242 108L265 74" stroke="#829479" stroke-width="2"/>
<path d="M100 312Q124 247 150 288Q133 296 142 315M327 314Q335 261 368 278Q348 299 356 314" fill="#acbc9c" opacity=".75"/>'''
ART['rabbit']=ground()+'''<ellipse cx="249" cy="251" rx="70" ry="55" fill="url(#cream)" stroke="#cabca8" stroke-width="2"/><circle cx="316" cy="258" r="21" fill="#fff8ed"/>
<ellipse cx="239" cy="299" rx="46" ry="12" fill="#e7d7c0"/><ellipse cx="183" cy="241" rx="22" ry="50" transform="rotate(-30 183 241)" fill="url(#cream)"/>
<ellipse cx="178" cy="101" rx="20" ry="72" transform="rotate(-12 178 101)" fill="url(#cream)" stroke="#cabca8" stroke-width="2"/>
<ellipse cx="226" cy="103" rx="20" ry="67" transform="rotate(8 226 103)" fill="url(#cream)" stroke="#cabca8" stroke-width="2"/>
<path d="M177 59Q160 102 187 139M226 62Q210 106 222 136" stroke="#e9c1cd" stroke-width="14" stroke-linecap="round"/>
<ellipse cx="202" cy="181" rx="65" ry="56" fill="url(#cream)" stroke="#cabca8" stroke-width="2"/>'''+eyes(202,173,22)+'''<ellipse cx="157" cy="193" rx="10" ry="5" fill="#eabfc9"/><ellipse cx="247" cy="193" rx="10" ry="5" fill="#eabfc9"/>'''
ART['deer']=ground()+'''<path d="M142 237L145 309H162L173 242M268 233L280 309H296L297 230" fill="#bf9b7c"/>
<ellipse cx="216" cy="224" rx="87" ry="49" fill="#ccad8c"/>
<path d="M270 225Q241 172 267 121L301 131Q323 191 290 249" fill="#ccad8c"/>
<path d="M264 116Q237 75 251 48M251 76l-23-16m29 36l-22-7M294 112Q321 73 306 44m3 29l24-16m-29 37l26-9" stroke="#aa9079" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M264 120Q220 99 216 123Q230 151 263 141M302 121Q343 99 348 120Q339 144 307 143" fill="#dac0a1"/>
<ellipse cx="282" cy="143" rx="33" ry="40" fill="url(#cream)"/><path d="M267 142q5 5 10 0m14 0q5 5 10 0" stroke="#967b6b" stroke-width="3" fill="none"/>
<ellipse cx="284" cy="165" rx="6" ry="4" fill="#a78670"/>
<g fill="#fff2d9"><ellipse cx="164" cy="213" rx="5" ry="7"/><ellipse cx="187" cy="200" rx="5" ry="7"/><ellipse cx="215" cy="209" rx="5" ry="7"/><ellipse cx="238" cy="198" rx="5" ry="7"/><ellipse cx="190" cy="229" rx="5" ry="7"/></g>'''
ART['sparrow']='''<path d="M190 185Q79 140 102 95Q171 108 202 155M276 159Q330 79 374 97Q361 151 300 190" fill="#cfb49a" stroke="#a58b79" stroke-width="2"/>
<path d="M220 238L197 278L250 261L277 283L269 237" fill="#ad9584"/>
<ellipse cx="244" cy="194" rx="63" ry="66" fill="#d2b79b"/><ellipse cx="246" cy="213" rx="45" ry="44" fill="url(#cream)"/>
<circle cx="247" cy="138" r="43" fill="#bc9c81"/><path d="M214 136Q246 158 279 135V154Q248 176 217 154" fill="#f8e7d0"/>
<circle cx="231" cy="139" r="4" fill="#806e63"/><circle cx="263" cy="139" r="4" fill="#806e63"/><path d="M242 148h10l-5 8Z" fill="#d6ad65"/>
<path d="M215 279l-12 9m53-11l12 9" stroke="#b59672" stroke-width="3"/>'''
ART['firefly']=''.join(f'<g><circle cx="{70+i*46}" cy="{105+(i*67)%155}" r="34" fill="url(#halo)"/><ellipse cx="{70+i*46}" cy="{105+(i*67)%155}" rx="4" ry="8" fill="#d7d99b"/><circle cx="{70+i*46}" cy="{100+(i*67)%155}" r="3" fill="#a2ad8d"/></g>' for i in range(8))

COLORS=['#e6b4be','#e8c293','#e6d7a0','#b7cdb3','#aecbd0','#bab8d7','#d2b8d8']
ART['doubleRainbow']=''.join(f'<path d="M{55+j*15} 285A{185-j*15} {185-j*15} 0 0 1 {425-j*15} 285" stroke="{c}" stroke-width="10" fill="none" opacity=".55"/>' for j,c in enumerate(COLORS))+''.join(f'<path d="M{18+j*5} 283A{222-j*5} {222-j*5} 0 0 1 {462-j*5} 283" stroke="{c}" stroke-width="4" fill="none" opacity=".25"/>' for j,c in enumerate(COLORS))
ART['sunbeams']='''<g fill="url(#gold)" opacity=".23"><path d="M58 15L212 329L281 329L104 15Z"/><path d="M155 0L298 331L324 331L181 0Z"/><path d="M257 0L360 310L408 310L306 0Z"/></g><path d="M10 66Q86 84 153 32M370 42Q422 101 479 77" stroke="#a6b18f" stroke-width="6" fill="none"/>'''+''.join(f'<ellipse cx="{x}" cy="{y}" rx="23" ry="9" transform="rotate({r} {x} {y})" fill="#b9c4a2"/>' for x,y,r in [(51,60,32),(90,50,-28),(121,45,32),(399,65,30),(435,72,-32)])+star(245,213,10)

def snowflake(x,y,r):
    return '<g stroke="#fff9ef" stroke-width="2" stroke-linecap="round" opacity=".9">'+''.join(f'<path d="M{x} {y-r}V{y+r}m{-r*.35} {-r*1.7}l{r*.35} {r*.28}l{r*.35} {-r*.28}" transform="rotate({a} {x} {y})"/>' for a in [0,60,120])+'</g>'
ART['gentleSnow']=''.join(snowflake(45+(i*79)%400,45+(i*67)%260,7+i%3*3) for i in range(17))
ART['firstSnow']='''<path d="M70 283Q238 208 416 271" stroke="#c7b3a4" stroke-width="6" fill="none"/><path d="M141 258L115 226M236 244L249 216M327 249L359 220" stroke="#c7b3a4" stroke-width="4"/>'''+''.join(snowflake(x,y,r) for x,y,r in [(125,98,21),(302,71,15),(230,168,17),(376,159,12),(77,192,8)])+'''<path d="M90 273Q128 254 169 250M233 241Q279 240 318 246" stroke="#fff9ef" stroke-width="8" fill="none" stroke-linecap="round"/>'''

def maple(x,y,s=1,color='#d4a17e'):
    return f'<g transform="translate({x} {y}) scale({s})"><path d="M0-28L8-12L22-17L18-3L30 2L12 14L4 12L0 26L-4 12L-12 14L-30 2L-18-3L-22-17L-8-12Z" fill="{color}"/><path d="M0-20V28M0 10L-17-2M0 10L17-2" stroke="#b98d72" stroke-width="1.5" fill="none"/></g>'
ART['autumnLeaves']='''<path d="M45 279Q151 146 407 105M156 186L127 100M272 139L280 61" fill="none" stroke="#ac9480" stroke-width="8" stroke-linecap="round"/>'''+''.join(maple(x,y,s,c) for x,y,s,c in [(108,144,1,'#d6a48c'),(169,174,1.3,'#e1b88b'),(221,136,1.1,'#d49e85'),(286,85,1,'#d8b37e'),(331,120,1.2,'#deb59b'),(390,104,.8,'#c8a78b')])
ART['swirlingLeaves']='''<path d="M60 220Q221 96 379 181Q441 238 299 275" stroke="#dfc9ab" stroke-width="2" fill="none" stroke-dasharray="3 9" opacity=".6"/>'''+maple(147,170,1.1)+maple(312,214,.85,'#dbc28c')+maple(382,115,.7,'#bfac8b')
ART['dew']='''<path d="M114 305Q115 212 194 130Q209 232 114 305M207 309Q188 183 278 78Q305 234 207 309M292 309Q302 204 385 177Q376 274 292 309" fill="#b1c2a3" stroke="#92ab92" stroke-width="2"/>'''+''.join(f'<g><path d="M{x} {y-18}Q{x+23} {y+10} {x} {y+16}Q{x-23} {y+10} {x} {y-18}" fill="#eef5e7" stroke="#bad0be" stroke-width="2"/><circle cx="{x-4}" cy="{y}" r="4" fill="#fffdf2"/></g>'+star(x+12,y-17,7) for x,y in [(160,228),(255,184),(338,259)])
ART['lightMotes']=''.join(f'<circle cx="{50+(i*83)%385}" cy="{55+(i*61)%249}" r="{20+i%4*5}" fill="url(#halo)"/>'+star(50+(i*83)%385,55+(i*61)%249,3+i%3,'#f6e5b3') for i in range(14))

def moon(x=240,y=170,r=80):
    return f'<circle cx="{x}" cy="{y}" r="{r*1.8}" fill="url(#halo)"/><circle cx="{x}" cy="{y}" r="{r}" fill="url(#cream)"/>'+''.join(f'<circle cx="{x+a*r}" cy="{y+b*r}" r="{c*r}" fill="#cdbd9d" opacity=".17"/>' for a,b,c in [(-.35,-.2,.2),(.3,.3,.13),(-.18,.5,.1),(.25,-.45,.12)])
ART['fullMoon']=moon()+star(105,115,7)+star(367,235,5)
ART['crescentMoon']='''<circle cx="240" cy="170" r="146" fill="url(#halo)"/><path d="M269 73A103 103 0 1 0 326 244A107 107 0 0 1 269 73Z" fill="url(#cream)"/>'''+star(335,104,7)+star(142,259,5)
ART['milkyWay']='''<path d="M25 290Q192 187 217 140Q295 69 455 73" stroke="url(#mist)" opacity=".4" stroke-width="74" fill="none" stroke-linecap="round"/>'''+''.join(star(38+(i*41)%411,59+(i*67)%239,2+i%4,'#fff6dc' if i%3 else '#c5b0d9') for i in range(45))
ART['aurora']=''.join(f'<path d="M-10 {95+i*21}Q95 {19+i*16} 167 {131+i*17}T310 {112+i*13}T490 {93+i*16}" stroke="{c}" stroke-width="{27-i*2}" opacity=".27" fill="none"/>' for i,c in enumerate(['#bddbcb','#d4c6e8','#f1d2df','#d7e9d0']))+''.join(star(65+i*73,265-i%2*30,4) for i in range(5))
ART['comet']='''<path d="M51 78Q160 182 356 237Q214 150 51 78" fill="url(#mist)" opacity=".65"/><path d="M85 101Q211 184 357 237" stroke="#edddb6" stroke-width="5" opacity=".7" fill="none"/><circle cx="358" cy="237" r="43" fill="url(#halo)"/>'''+star(358,237,16,'#f7e8b8')
POINTS=[(79,214),(148,135),(211,180),(274,98),(327,160),(390,124),(404,243)]
ART['constellation']='<path d="M'+'L'.join(f'{x} {y}' for x,y in POINTS)+'" stroke="#c8b9d7" stroke-width="2" fill="none" opacity=".75"/>'+''.join(star(x,y,8 if i%2 else 11,'#e1c895') for i,(x,y) in enumerate(POINTS))
ART['moonHalo']=moon(r=52)+'''<circle cx="240" cy="170" r="108" stroke="#d9c7e0" stroke-width="5" fill="none" opacity=".45"/><circle cx="240" cy="170" r="117" stroke="#edddb9" stroke-width="2" fill="none" opacity=".65"/>'''
ART['heartCloud']='''<path d="M240 256Q120 205 115 143Q107 84 161 80Q211 68 240 118Q270 69 319 80Q373 85 364 144Q356 206 240 256Z" fill="url(#pink)" opacity=".8"/><path d="M141 130Q149 101 178 104M174 221Q147 209 136 190" stroke="#fff6f0" stroke-width="10" fill="none" opacity=".6" stroke-linecap="round"/>'''

def flame(x,y,s=1):
    return f'<g transform="translate({x} {y}) scale({s})"><ellipse cy="26" rx="62" ry="70" fill="url(#halo)"/><path d="M0-65Q15-25 34-10Q54 30 8 50Q-41 48-36 12Q-31-10-14-21Q-18 5-6 7Q12-3 0-65" fill="#bcd9d7" opacity=".8"/><path d="M4-16Q31 18 8 37Q-14 36-17 19Q3 23 4-16" fill="#fff2cb"/></g>'
ART['foxfire']=flame(120,180,.7)+flame(250,145,1)+flame(365,210,.55)

def torii():
    return '''<path d="M119 94L126 299M355 94L349 299" stroke="url(#gold)" stroke-width="18"/><path d="M81 80Q240 109 399 80L393 98Q240 124 87 98Z" fill="url(#gold)"/><path d="M105 149H376M240 110V150" stroke="url(#gold)" stroke-width="12"/><rect x="226" y="117" width="28" height="32" rx="3" fill="#fff2ce" stroke="#c6a56e"/><path d="M140 170Q240 196 340 170" stroke="#e0cba4" stroke-width="4" fill="none"/>'''
ART['glowingTorii']='<ellipse cx="240" cy="190" rx="210" ry="155" fill="url(#halo)"/>'+torii()+''.join(star(x,y,8) for x,y in [(96,133),(377,217),(181,252)])
ART['ringingBell']='''<path d="M240 32V105" stroke="#d3bd96" stroke-width="9"/><path d="M240 32V105" stroke="#f4e6c4" stroke-width="3" stroke-dasharray="5 8"/><path d="M180 212Q187 169 195 140Q240 106 285 140L303 213Q240 244 180 212" fill="url(#gold)" stroke="#b9986d" stroke-width="3"/><ellipse cx="241" cy="213" rx="61" ry="19" fill="#b39469"/><ellipse cx="241" cy="208" rx="55" ry="14" fill="#e1bd7f"/><path d="M240 222V246" stroke="#9f845f" stroke-width="4"/><circle cx="240" cy="248" r="7" fill="#b99869"/><path d="M156 153Q131 185 154 218M326 153Q350 185 328 218M135 137Q94 185 134 234M349 137Q391 185 351 234" stroke="#dfcdaa" stroke-width="3" fill="none" opacity=".7"/>'''
ART['glowingEma']='''<ellipse cx="240" cy="189" rx="180" ry="147" fill="url(#halo)"/><path d="M240 34Q196 67 223 104M240 34Q285 67 257 104" stroke="#c29898" stroke-width="5" fill="none"/><path d="M103 165L240 91L377 165V284Q377 297 363 297H117Q103 297 103 283Z" fill="url(#cream)" stroke="#d4b78c" stroke-width="3"/><path d="M119 175L240 110L361 175V279H119Z" stroke="#e5c58e" stroke-width="2" fill="none"/><circle cx="240" cy="128" r="7" fill="#b99a7c"/>'''+flower(240,214,38)+star(112,116,9)+star(389,248,10)
ART['rainbowWind']=''.join(f'<path d="M12 {123+i*16}Q142 {32+i*19} 243 {164+i*12}T470 {131+i*15}" stroke="{c}" stroke-width="5" fill="none" opacity=".55"/>' for i,c in enumerate(COLORS))
ART['divineFootprints']=''.join(f'<g transform="translate({210+(i%2)*66-i*4} {300-i*37}) rotate({-12 if i%2 else 12})" opacity="{.3+i*.09}"><ellipse rx="9" ry="17" fill="#e8ca8d"/><circle cx="-6" cy="-22" r="4" fill="#efd9a5"/><circle cx="2" cy="-24" r="4" fill="#efd9a5"/><circle cx="9" cy="-21" r="3" fill="#efd9a5"/></g>' for i in range(7))

def tree(bloom=False):
    canopy='#c8c8a0' if not bloom else '#edc6cf'
    return '''<ellipse cx="240" cy="180" rx="202" ry="164" fill="url(#halo)"/><path d="M219 178Q230 260 181 318L234 302L254 317L262 293L300 317Q259 256 269 175" fill="#b09a7b" stroke="#9a876f" stroke-width="2"/><path d="M241 235L183 155M253 214L312 140" stroke="#b09a7b" stroke-width="17" stroke-linecap="round"/>'''+f'<g fill="{canopy}"><ellipse cx="167" cy="150" rx="66" ry="52"/><ellipse cx="240" cy="101" rx="83" ry="62"/><ellipse cx="314" cy="146" rx="69" ry="57"/><ellipse cx="242" cy="166" rx="89" ry="49"/></g>'+'''<path d="M208 252Q244 273 278 251" stroke="#e2c998" stroke-width="5" fill="none"/><path d="M224 264l8 4l-8 9l8 5l-6 9m28-27l8 4l-8 9l8 5l-6 9" stroke="#fff6e6" stroke-width="4" fill="none"/>'''+(''.join(flower(x,y,9) for x,y in [(151,132),(207,99),(268,78),(302,139),(248,162),(184,177),(334,169),(274,127),(218,146)]) if bloom else ''.join(star(x,y,6) for x,y in [(156,138),(252,94),(319,158)]))
ART['sacredTree']=tree()
ART['floweringTree']=tree(True)
ART['goldenFeather']='''<path d="M125 292Q143 148 358 59Q331 256 125 292" fill="url(#gold)" opacity=".85"/><path d="M119 309L338 82M150 276L165 203M174 254L213 159M204 225L254 128M235 194L293 104M160 267L223 267M188 238L272 231M221 208L305 184M257 171L331 135" stroke="#fff4d1" stroke-width="3" fill="none" stroke-linecap="round"/>'''+star(313,264,7)
ART['dragon']='''<g opacity=".6" fill="#f6eee2"><ellipse cx="98" cy="274" rx="76" ry="20"/><ellipse cx="370" cy="80" rx="70" ry="19"/></g>
<path d="M56 245Q142 290 160 207Q166 127 237 153Q308 187 319 129Q329 76 378 126" stroke="#b9c9b1" stroke-width="43" fill="none" stroke-linecap="round"/>
<path d="M57 247Q141 285 162 208Q168 138 238 163Q310 196 327 136Q335 99 369 127" stroke="#f4e8c7" stroke-width="17" fill="none" stroke-linecap="round"/>
<path d="M95 257l8-28l17 18m35-39l-18-16l26-8m49-35l8-22l16 26m59 7l9 23l16-25m9-48l-17-18l26 1" fill="#d6ba7c"/>
<path d="M358 119Q367 93 393 106L421 126L414 151L389 159L363 142Z" fill="#c6d1ba" stroke="#97ad96" stroke-width="2"/>
<path d="M371 109L356 78L382 100M397 106L408 77L409 118" fill="#e0c38b"/>
<path d="M384 130q8 6 15-2" stroke="#8c9e86" stroke-width="3" fill="none"/><path d="M412 145Q448 164 450 130M407 153Q445 189 452 164" stroke="#d9bd86" stroke-width="3" fill="none"/>
<path d="M211 174L218 213L201 224m17-11l14 8M295 158L289 211L307 219m-18-8l-10 9" stroke="#b4c3a5" stroke-width="8" fill="none" stroke-linecap="round"/>
<path d="M379 157l4 21l10-19" fill="#e6cb99"/>'''
ART['phoenix']='''<circle cx="240" cy="169" r="137" fill="url(#halo)"/>
<path d="M224 176Q162 87 50 60Q71 176 194 220M256 176Q318 87 430 60Q409 176 286 220" fill="url(#gold)" stroke="#d5b879" stroke-width="2"/>
<path d="M208 177Q136 100 84 90M197 190Q125 132 81 126M272 177Q344 100 396 90M283 190Q355 132 399 126" stroke="#fff1c8" stroke-width="5" fill="none"/>
<path d="M224 200Q168 265 153 319Q224 301 244 232Q257 302 325 326Q322 263 256 198" fill="#e5bec0" opacity=".8"/>
<path d="M239 213Q206 282 211 331M248 213Q275 282 271 331" stroke="#d7b87a" stroke-width="6" fill="none"/>
<path d="M222 168Q238 142 232 121Q224 97 244 89Q268 92 257 116Q254 142 265 173Q271 207 244 233Q215 206 222 168" fill="url(#gold)" stroke="#caa66a" stroke-width="2"/>
<path d="M240 90l-9-22m13 20l7-23M259 102l17 7l-18 4" fill="#e2be7d" stroke="#d3ae70" stroke-width="3"/><circle cx="250" cy="101" r="2.5" fill="#997954"/>'''
ART['goldenButterfly']='''<circle cx="240" cy="180" r="135" fill="url(#halo)"/><path d="M236 176Q192 76 126 114Q89 162 217 211Q132 176 143 246Q173 281 235 203M244 176Q288 76 354 114Q391 162 263 211Q348 176 337 246Q307 281 245 203" fill="url(#gold)" stroke="#d2b376" stroke-width="2"/>
<path d="M236 173Q220 143 209 146M244 173Q260 143 271 146" fill="none" stroke="#b59664" stroke-width="3"/><ellipse cx="240" cy="192" rx="5" ry="33" fill="#bda070"/>
<path d="M226 185L156 134M254 185L324 134M219 218L165 245M261 218L315 245" stroke="#fff3cf" stroke-width="3"/>'''
ART['goldenGround']='''<ellipse cx="240" cy="234" rx="235" ry="126" fill="url(#halo)"/><path d="M16 255Q240 192 464 255L434 301Q240 343 46 301Z" fill="url(#gold)" opacity=".19"/>'''+''.join(star(39+(i*77)%407,83+(i*41)%205,4+i%4,'#e9ce94') for i in range(16))
ART['rainbowShootingStar']=''.join(f'<path d="M{36+i*2} {83+i*6}Q190 {162+i*5} 377 248" stroke="{c}" stroke-width="5" opacity=".65" fill="none"/>' for i,c in enumerate(COLORS))+star(377,248,20,'#f7e7ba')+star(377,248,9,'#fff8e2')
ART['skyTorii']='''<ellipse cx="240" cy="170" rx="225" ry="170" fill="url(#halo)"/>'''+torii()+'''<g fill="#f7e9df" opacity=".75"><ellipse cx="99" cy="290" rx="69" ry="19"/><ellipse cx="375" cy="293" rx="79" ry="20"/></g>'''+star(72,145,8)+star(403,169,8)

assert len(ART)==40, len(ART)
for name,body in ART.items():
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" fill="none" stroke-linejoin="round" stroke-linecap="round">{DEFS}{body}</svg>\n'
    (OUT/f'{name}.svg').write_text(svg)
print(f'Generated {len(ART)} original SVG illustrations ({sum((OUT/f"{n}.svg").stat().st_size for n in ART):,} bytes)')
