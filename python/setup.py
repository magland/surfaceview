from setuptools import setup, find_packages

setup(
    packages=find_packages(),
    scripts=[
        'bin/vtk-to-mesh-json',
        'bin/surfaceview-start-compute'
    ],
    install_requires=[
        'vtk',
        'click',
        'hither',
        'google-cloud-storage',
        'paho-mqtt'
    ]
)