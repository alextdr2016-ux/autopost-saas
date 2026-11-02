import os
import random
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import product_poster as pp  # noqa: E402

TODAY = datetime(2026, 11, 2)


def prod(pid, name, stock=1):
    return {'id': str(pid), 'name': name, 'stock': stock}


def candidates(monkeypatch, products, history):
    """Întoarce lista din care select_product alege la întâmplare."""
    monkeypatch.setattr(random, 'choice', lambda seq: list(seq))
    return sorted(int(p['id']) for p in pp.select_product(products, history, today=TODAY))


def test_produsele_vechi_sunt_eligibile_nu_doar_cele_mai_noi(monkeypatch):
    products = [prod(i, f'Rochie Model{i} negru') for i in range(1, 16)]
    assert candidates(monkeypatch, products, {}) == list(range(1, 16))


def test_sare_produsele_postate_in_ultimele_90_zile(monkeypatch):
    products = [prod(1, 'Rochie Ana negru'), prod(2, 'Rochie Bianca rosu')]
    history = {'1': ('2026-08-10', 'Rochie Ana negru')}  # acum 84 zile
    assert candidates(monkeypatch, products, history) == [2]


def test_produs_postat_acum_peste_90_zile_revine(monkeypatch):
    products = [prod(1, 'Rochie Ana negru'), prod(2, 'Rochie Bianca rosu')]
    history = {'1': ('2026-07-20', 'Rochie Ana negru')}  # acum 105 zile
    assert candidates(monkeypatch, products, history) == [1, 2]


def test_sare_acelasi_model_in_alta_culoare_postat_in_ultimele_14_zile(monkeypatch):
    products = [prod(1, 'Rochie Anastasia mov cu drapaj'), prod(2, 'Rochie Bianca rosu')]
    history = {'9': ('2026-10-25', 'Rochie Anastasia verde cu drapaj')}
    assert candidates(monkeypatch, products, history) == [2]


def test_model_postat_acum_peste_14_zile_e_eligibil(monkeypatch):
    products = [prod(1, 'Rochie Anastasia mov cu drapaj'), prod(2, 'Rochie Bianca rosu')]
    history = {'9': ('2026-10-10', 'Rochie Anastasia verde cu drapaj')}
    assert candidates(monkeypatch, products, history) == [1, 2]


def test_daca_toate_modelele_sunt_recente_ignora_regula_de_model(monkeypatch):
    products = [prod(1, 'Rochie Anastasia mov')]
    history = {'9': ('2026-10-30', 'Rochie Anastasia verde')}
    assert candidates(monkeypatch, products, history) == [1]


def test_produsele_fara_stoc_nu_se_posteaza(monkeypatch):
    products = [prod(1, 'Rochie Ana negru', stock=0), prod(2, 'Rochie Bianca rosu')]
    assert candidates(monkeypatch, products, {}) == [2]


def test_daca_toate_sunt_postate_recent_alege_pe_cel_postat_cel_mai_demult():
    products = [prod(1, 'Rochie Ana negru'), prod(2, 'Rochie Bianca rosu')]
    history = {'1': ('2026-10-01', 'Rochie Ana negru'), '2': ('2026-09-01', 'Rochie Bianca rosu')}
    assert pp.select_product(products, history, today=TODAY)['id'] == '2'
