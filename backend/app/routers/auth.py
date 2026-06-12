from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.usuario import Usuario, RolUsuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, TokenResponse
from app.utils.helpers import hash_password, verify_password, create_access_token, decode_token

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)

# Esquema OAuth2 — apunta al endpoint de login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── dependencia reutilizable ──────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db:    Session = Depends(get_db)
) -> Usuario:
    """Extrae el usuario autenticado desde el token JWT. Úsala en cualquier endpoint."""
    email = decode_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario or not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo",
        )
    return usuario


def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Dependencia que además exige rol admin."""
    if current_user.rol != RolUsuario.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol administrador"
        )
    return current_user


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/registro",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED
)
def registrar_usuario(
    datos: UsuarioCreate,
    db:    Session = Depends(get_db)
):
    # Email único
    if db.query(Usuario).filter(Usuario.email == datos.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese email"
        )

    usuario = Usuario(
        nombre          = datos.nombre,
        email           = datos.email,
        hashed_password = hash_password(datos.password),
        rol             = datos.rol,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.post("/login", response_model=TokenResponse)
def login(
    form:  OAuth2PasswordRequestForm = Depends(),
    db:    Session                   = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.email == form.username).first()

    if not usuario or not verify_password(form.password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta desactivada"
        )

    token = create_access_token({"sub": usuario.email})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UsuarioResponse)
def mi_perfil(current_user: Usuario = Depends(get_current_user)):
    """Retorna los datos del usuario autenticado actualmente."""
    return current_user
