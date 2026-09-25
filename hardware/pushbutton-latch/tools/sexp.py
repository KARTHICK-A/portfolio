import re
TOK=re.compile(r'\s*(?:(\()|(\))|("(?:[^"\\]|\\.)*")|([^\s()"]+))')
def parse(s):
    stack=[[]];pos=0
    while True:
        m=TOK.match(s,pos)
        if not m or m.end()==pos: break
        pos=m.end()
        if m.group(1): stack.append([])
        elif m.group(2): x=stack.pop(); stack[-1].append(x)
        elif m.group(3): stack[-1].append(('S',m.group(3)[1:-1].replace('\\"','"')))
        else: stack[-1].append(m.group(4))
    return stack[0][0]
def dump(x,ind=0):
    if isinstance(x,tuple): return '"'+x[1].replace('\\','\\\\').replace('"','\\"').replace('\n','\\n')+'"'
    if isinstance(x,list):
        parts=[dump(y,ind+1) for y in x]
        s='('+' '.join(parts)+')'
        if len(s)<100: return s
        return '('+parts[0]+''.join('\n'+'  '*(ind+1)+p for p in parts[1:])+')'
    return str(x)
def val(x): return x[1] if isinstance(x,tuple) else x
def find(node,key): return [c for c in node if isinstance(c,list) and c and c[0]==key]
_libs={}
def lib(name):
    if name not in _libs: _libs[name]=parse(open(f'/usr/share/kicad/symbols/{name}.kicad_sym').read())
    return _libs[name]
def symbol(libname,sym):
    L=lib(libname)
    for s in find(L,'symbol'):
        if val(s[1])==sym: return s
    raise KeyError(sym)
def pins(libname,sym):
    s=symbol(libname,sym); out=[]
    ext=find(s,'extends')
    base=symbol(libname,val(ext[0][1])) if ext else s
    for sub in find(base,'symbol'):
        for p in find(sub,'pin'):
            name=val(find(p,'name')[0][1]); num=val(find(p,'number')[0][1]); at=find(p,'at')[0]
            out.append((num,name,p[1],float(at[1]),float(at[2]),int(float(at[3])) if len(at)>3 else 0))
    return out
def props(libname,sym):
    return {val(p[1]):val(p[2]) for p in find(symbol(libname,sym),'property')}
