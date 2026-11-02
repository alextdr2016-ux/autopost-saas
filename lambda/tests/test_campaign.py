import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import product_poster as pp  # noqa: E402

CAMPAIGN = {
    'PK': 'TENANT#t1', 'SK': 'CAMPAIGN#black-month-2026',
    'start_date': '2026-11-01', 'end_date': '2026-12-05',
    'caption': 'Text campanie\nhttps://ejolie.ro/black-friday',
}


class FakeTable:
    def __init__(self, items):
        self.items = items

    def query(self, **kwargs):
        return {'Items': self.items}


def test_campania_e_activa_intre_start_si_ziua_dinaintea_sfarsitului(monkeypatch):
    monkeypatch.setattr(pp, 'table', FakeTable([CAMPAIGN]))
    for day in ['2026-11-01', '2026-11-03', '2026-12-04']:
        assert pp.get_active_campaign('t1', 'Europe/Bucharest', today=day) == CAMPAIGN


def test_campania_nu_e_activa_inainte_de_start_si_din_ziua_de_sfarsit(monkeypatch):
    monkeypatch.setattr(pp, 'table', FakeTable([CAMPAIGN]))
    for day in ['2026-10-31', '2026-12-05', '2026-12-20']:
        assert pp.get_active_campaign('t1', 'Europe/Bucharest', today=day) is None


def test_fara_campanii_nu_e_nimic_activ(monkeypatch):
    monkeypatch.setattr(pp, 'table', FakeTable([]))
    assert pp.get_active_campaign('t1', 'Europe/Bucharest', today='2026-11-03') is None


def make_frame():
    """Ramă 100x100: margine neagră de 10 px, interior transparent."""
    frame = Image.new('RGBA', (100, 100), (0, 0, 0, 255))
    frame.paste((0, 0, 0, 0), (10, 10, 90, 90))
    return frame


def test_poza_intra_intreaga_in_interiorul_ramei():
    product = Image.new('RGB', (40, 80), (255, 0, 0))  # verticală, ca o rochie
    out = pp.compose_campaign_banner(product, make_frame(), '#f7f7f7')
    assert out.size == (100, 100)
    assert out.getpixel((50, 50)) == (255, 0, 0)        # produsul în centru
    assert out.getpixel((50, 11)) == (255, 0, 0)        # încape pe toată înălțimea
    assert out.getpixel((12, 50)) == (247, 247, 247)    # lateral: fundal, nu tăiat
    assert out.getpixel((5, 50)) == (0, 0, 0)           # rama rămâne deasupra
